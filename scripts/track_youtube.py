"""Capture public view totals and the most-liked top-level comment posted today."""
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

VIDEO_ID = 'XJzRgeX-bwo'
ZONE = ZoneInfo('Asia/Seoul')
DATA = Path(__file__).resolve().parents[1] / 'assets/youtube/daily.json'


class APIError(RuntimeError):
    def __init__(self, reason):
        self.reason = reason
        super().__init__('YouTube request failed: ' + reason)


def request_api(resource, parameters, key):
    url = 'https://www.googleapis.com/youtube/v3/' + resource + '?' + urlencode({**parameters, 'key': key})
    for attempt in range(3):
        try:
            with urlopen(Request(url), timeout=30) as response:
                return json.load(response)
        except HTTPError as error:
            try:
                reason = json.load(error)['error']['errors'][0]['reason']
            except (ValueError, KeyError, IndexError):
                reason = 'HTTP ' + str(error.code)
            if error.code < 500 or attempt == 2:
                raise APIError(reason) from None
        except (URLError, TimeoutError):
            if attempt == 2:
                raise APIError('network unavailable') from None
        time.sleep(2 ** attempt)


def top_comment(fetch, start, end, max_pages=1000):
    """Scan newest-first; stop only once the complete day's top-level comments are covered."""
    best = None
    token = None
    for _ in range(max_pages):
        params = {'part': 'snippet', 'videoId': VIDEO_ID, 'order': 'time', 'maxResults': 100, 'textFormat': 'plainText'}
        if token:
            params['pageToken'] = token
        response = fetch('commentThreads', params)
        passed_start = False
        for item in response.get('items', []):
            comment = item['snippet']['topLevelComment']
            snippet = comment['snippet']
            posted = datetime.fromisoformat(snippet['publishedAt'].replace('Z', '+00:00'))
            if posted < start:
                passed_start = True
                continue
            if posted > end:
                continue
            candidate = {'id': comment['id'], 'author': snippet['authorDisplayName'],
                         'text': snippet.get('textOriginal', snippet['textDisplay']),
                         'likes': int(snippet['likeCount']), 'published_at': snippet['publishedAt'],
                         'url': 'https://www.youtube.com/watch?' + urlencode({'v': VIDEO_ID, 'lc': comment['id']})}
            # Stable tie-break: earliest published comment, then its ID.
            if best is None or (-candidate['likes'], candidate['published_at'], candidate['id']) < (-best['likes'], best['published_at'], best['id']):
                best = candidate
        token = response.get('nextPageToken')
        if passed_start or not token:
            return best
    raise APIError('daily comment scan limit reached; no incomplete ranking was saved')


def save_snapshot(data, snapshot):
    records = {record['date']: record for record in data['snapshots']}
    # Preserve the first successful capture on a date; manual retries cannot shift the baseline.
    records.setdefault(snapshot['date'], snapshot)
    data['snapshots'] = [records[day] for day in sorted(records)]
    return data


def main():
    key = os.environ.get('YOUTUBE_API_KEY')
    if not key:
        raise APIError('YOUTUBE_API_KEY is not configured')
    now = datetime.now(timezone.utc)
    local = now.astimezone(ZONE)
    data = json.loads(DATA.read_text())
    if any(record['date'] == local.date().isoformat() for record in data['snapshots']):
        print('Today already has a snapshot; unchanged.')
        return
    fetch = lambda resource, params: request_api(resource, params, key)
    response = fetch('videos', {'part': 'snippet,statistics', 'id': VIDEO_ID})
    if not response.get('items'):
        raise APIError('video unavailable')
    video = response['items'][0]
    views = int(video['statistics']['viewCount'])
    if views < 0:
        raise APIError('invalid view count')
    start = local.replace(hour=0, minute=0, second=0, microsecond=0)
    comment_status = 'available'
    try:
        comment = top_comment(fetch, start, now)
        if comment is None:
            comment_status = 'no_comments'
    except APIError as error:
        if error.reason != 'commentsDisabled':
            raise
        comment = None
        comment_status = 'disabled'
    data['title'] = video['snippet']['title']
    save_snapshot(data, {'date': local.date().isoformat(), 'captured_at': now.isoformat(),
                         'views': views, 'top_comment': comment, 'comment_status': comment_status})
    temporary = DATA.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(DATA)
    print('Saved snapshot for ' + local.date().isoformat())


if __name__ == '__main__':
    try:
        main()
    except (APIError, KeyError, ValueError) as error:
        # Never log request URLs (which include the API key) or remote comment bodies.
        print(str(error) if isinstance(error, APIError) else 'Invalid YouTube response or history data', file=sys.stderr)
        sys.exit(1)
