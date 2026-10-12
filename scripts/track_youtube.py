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


def top_comment(fetch, start, end, max_pages=1000, video_id=VIDEO_ID):
    """Scan newest-first; stop only once the complete day's top-level comments are covered."""
    best = None
    token = None
    for _ in range(max_pages):
        params = {'part': 'snippet', 'videoId': video_id, 'order': 'time', 'maxResults': 100, 'textFormat': 'plainText'}
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
                         'url': 'https://www.youtube.com/watch?' + urlencode({'v': video_id, 'lc': comment['id']})}
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


def capture_video(data, fetch, now):
    local = now.astimezone(ZONE)
    video_id = data.get('video_id', VIDEO_ID)
    if any(record['date'] == local.date().isoformat() for record in data['snapshots']):
        print('Today already has a snapshot; unchanged.')
        return False
    response = fetch('videos', {'part': 'snippet,statistics', 'id': video_id})
    if not response.get('items'):
        raise APIError('video unavailable')
    video = response['items'][0]
    views = int(video['statistics']['viewCount'])
    if views < 0:
        raise APIError('invalid view count')
    start = local.replace(hour=0, minute=0, second=0, microsecond=0)
    comment_status = 'available'
    try:
        comment = top_comment(fetch, start, now, video_id=video_id)
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
    return True


def translate_comment(comment, key):
    """Store an English translation only when the detected language is neither English nor Chinese."""
    url = 'https://translation.googleapis.com/language/translate/v2?' + urlencode({'key': key})
    payload = json.dumps({'q': comment['text'], 'target': 'en', 'format': 'text'}).encode()
    try:
        with urlopen(Request(url, data=payload, headers={'Content-Type': 'application/json'}), timeout=30) as response:
            result = json.load(response)['data']['translations'][0]
        language = result['detectedSourceLanguage'].lower()
        comment['source_language'] = language
        if language.split('-')[0] not in ('en', 'zh'):
            import html
            comment['translation'] = {'text': html.unescape(result['translatedText']), 'language': 'en', 'provider': 'Google Cloud Translation'}
        comment.pop('translation_status', None)
        return True
    except (HTTPError, URLError, TimeoutError, KeyError, ValueError, IndexError):
        # Translation failures must not discard the daily view/comment capture or leak API credentials.
        comment['translation_status'] = 'unavailable'
        print('Comment translation unavailable; original text retained.', file=sys.stderr)
        return False


def enrich_translations(videos, key):
    changed = False
    if not key:
        return changed
    for video in videos:
        for snapshot in video['snapshots']:
            comment = snapshot.get('top_comment')
            if comment and not comment.get('source_language'):
                before = json.dumps(comment, sort_keys=True)
                translate_comment(comment, key)
                changed = changed or before != json.dumps(comment, sort_keys=True)
    return changed


def main():
    key = os.environ.get('YOUTUBE_API_KEY')
    if not key:
        raise APIError('YOUTUBE_API_KEY is not configured')
    now = datetime.now(timezone.utc)
    local = now.astimezone(ZONE)
    data = json.loads(DATA.read_text())
    videos = data.get('videos', [data])
    if not isinstance(videos, list) or not videos:
        raise APIError('no tracked videos configured')
    import re
    ids = [video.get('video_id', VIDEO_ID) for video in videos]
    if any(not re.fullmatch(r'[A-Za-z0-9_-]{11}', id) for id in ids) or len(ids) != len(set(ids)):
        raise APIError('invalid or duplicate video ID')
    fetch = lambda resource, params: request_api(resource, params, key)
    changed = False
    for video in videos:
        changed = capture_video(video, fetch, now) or changed
    changed = enrich_translations(videos, os.environ.get('TRANSLATION_API_KEY')) or changed
    if not changed:
        return
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
