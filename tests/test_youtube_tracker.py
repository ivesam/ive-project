import importlib.util
import unittest
import tempfile
from unittest.mock import patch
import json
from datetime import datetime, timezone
from pathlib import Path

spec = importlib.util.spec_from_file_location('tracker', Path(__file__).resolve().parents[1] / 'scripts/track_youtube.py')
tracker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tracker)
START = datetime(2026, 10, 7, 15, tzinfo=timezone.utc) # Midnight Oct 8 KST
END = datetime(2026, 10, 8, 14, 55, tzinfo=timezone.utc)


def comment(id, time, likes):
    return {'snippet': {'topLevelComment': {'id': id, 'snippet': {'publishedAt': time, 'likeCount': likes, 'authorDisplayName': 'Author', 'textDisplay': 'Test'}}}}


class TrackerTest(unittest.TestCase):
    def test_scan_pages_and_exclude_other_days(self):
        pages = iter([
            {'items': [comment('future', '2026-10-08T15:00:00Z', 500), comment('recent', '2026-10-08T14:00:00Z', 4)], 'nextPageToken': 'second'},
            {'items': [comment('winner', '2026-10-07T15:00:00Z', 30), comment('old', '2026-10-07T14:59:59Z', 999)], 'nextPageToken': 'unused'}])
        tokens = []
        def fetch(resource, params):
            tokens.append(params.get('pageToken'))
            return next(pages)
        self.assertEqual(tracker.top_comment(fetch, START, END)['id'], 'winner')
        self.assertEqual(tokens, [None, 'second'])

    def test_ties_are_stable(self):
        items = [comment('newer', '2026-10-08T10:00:00Z', 5), comment('earlier', '2026-10-08T09:00:00Z', 5)]
        self.assertEqual(tracker.top_comment(lambda *args: {'items': items}, START, END)['id'], 'earlier')

    def test_empty_day_and_incomplete_scan(self):
        self.assertIsNone(tracker.top_comment(lambda *args: {'items': []}, START, END))
        with self.assertRaises(tracker.APIError):
            tracker.top_comment(lambda *args: {'items': [comment('one', '2026-10-08T10:00:00Z', 1)], 'nextPageToken': 'more'}, START, END, max_pages=1)

    def test_failure_preserves_history_and_disabled_comments_save_views(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'daily.json'
            original = json.dumps({'snapshots': []})
            path.write_text(original)
            video = {'items': [{'snippet': {'title': 'Example'}, 'statistics': {'viewCount': '123'}}]}
            def failing(resource, params, key):
                if resource == 'videos':
                    return video
                raise tracker.APIError('quotaExceeded')
            with patch.object(tracker, 'DATA', path), patch.dict('os.environ', {'YOUTUBE_API_KEY': 'test-only'}), patch.object(tracker, 'request_api', failing):
                with self.assertRaises(tracker.APIError):
                    tracker.main()
            self.assertEqual(path.read_text(), original)
            def disabled(resource, params, key):
                if resource == 'videos':
                    return video
                raise tracker.APIError('commentsDisabled')
            with patch.object(tracker, 'DATA', path), patch.dict('os.environ', {'YOUTUBE_API_KEY': 'test-only'}), patch.object(tracker, 'request_api', disabled):
                tracker.main()
            snapshot = json.loads(path.read_text())['snapshots'][0]
            self.assertEqual(snapshot['views'], 123)
            self.assertEqual(snapshot['comment_status'], 'disabled')
            self.assertIsNone(snapshot['top_comment'])

    def test_repeat_capture_does_not_replace_baseline(self):
        data = {'snapshots': [{'date': '2026-10-08', 'views': 100}]}
        tracker.save_snapshot(data, {'date': '2026-10-08', 'views': 150})
        self.assertEqual(data['snapshots'][0]['views'], 100)
        tracker.save_snapshot(data, {'date': '2026-10-07', 'views': 80})
        self.assertEqual([row['views'] for row in data['snapshots']], [80, 100])


if __name__ == '__main__':
    unittest.main()
