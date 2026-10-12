import importlib.util
import unittest
import tempfile
from unittest.mock import patch
from io import BytesIO
from urllib.error import URLError
import json
from datetime import datetime, timezone, timedelta
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

    def test_multiple_videos_keep_comments_and_views_separate(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'daily.json'
            path.write_text(json.dumps({'videos': [{'video_id': 'XJzRgeX-bwo', 'snapshots': []}, {'video_id': 'abcdefghijk', 'snapshots': []}]}))
            def fetch(resource, params, key):
                if resource == 'videos':
                    return {'items': [{'snippet': {'title': params['id']}, 'statistics': {'viewCount': '123' if params['id'] == 'XJzRgeX-bwo' else '456'}}]}
                today = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()
                return {'items': [comment(params['videoId'], today, 10)]}
            with patch.object(tracker, 'DATA', path), patch.dict('os.environ', {'YOUTUBE_API_KEY': 'test-only'}), patch.object(tracker, 'request_api', fetch):
                tracker.main()
            videos = json.loads(path.read_text())['videos']
            self.assertEqual([v['snapshots'][0]['views'] for v in videos], [123, 456])
            for v in videos:
                self.assertIn('v=' + v['video_id'], v['snapshots'][0]['top_comment']['url'])

    def test_later_video_failure_does_not_write_partial_history(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'daily.json'
            original = json.dumps({'videos': [{'video_id': 'XJzRgeX-bwo', 'snapshots': []}, {'video_id': 'abcdefghijk', 'snapshots': []}]})
            path.write_text(original)
            def fetch(resource, params, key):
                if params.get('id') == 'abcdefghijk':
                    raise tracker.APIError('video unavailable')
                return {'items': [{'snippet': {'title': 'One'}, 'statistics': {'viewCount': '123'}}]} if resource == 'videos' else {'items': []}
            with patch.object(tracker, 'DATA', path), patch.dict('os.environ', {'YOUTUBE_API_KEY': 'test-only'}), patch.object(tracker, 'request_api', fetch):
                with self.assertRaises(tracker.APIError):
                    tracker.main()
            self.assertEqual(path.read_text(), original)

    def test_translations_keep_english_and_chinese_original(self):
        for language in ['en', 'zh-CN', 'zh-TW', 'ko']:
            original = {'text': 'Original comment'}
            response = BytesIO(json.dumps({'data': {'translations': [{'detectedSourceLanguage': language, 'translatedText': 'Hello &amp; welcome'}]}}).encode())
            with patch.object(tracker, 'urlopen', return_value=response):
                self.assertTrue(tracker.translate_comment(original, 'test-only'))
            self.assertEqual(original['text'], 'Original comment')
            if language == 'ko':
                self.assertEqual(original['translation']['text'], 'Hello & welcome')
            else:
                self.assertNotIn('translation', original)

    def test_translation_failure_and_retry_preserve_snapshot(self):
        snapshot = {'date': '2026-10-08', 'views': 123, 'top_comment': {'text': 'Original'}}
        videos = [{'snapshots': [snapshot]}]
        with patch.object(tracker, 'urlopen', side_effect=URLError('test')):
            self.assertTrue(tracker.enrich_translations(videos, 'test-only'))
        self.assertEqual(snapshot['views'], 123)
        self.assertEqual(snapshot['top_comment']['text'], 'Original')
        self.assertNotIn('source_language', snapshot['top_comment'])
        response = BytesIO(json.dumps({'data': {'translations': [{'detectedSourceLanguage': 'ja', 'translatedText': 'Translated'}]}}).encode())
        with patch.object(tracker, 'urlopen', return_value=response):
            self.assertTrue(tracker.enrich_translations(videos, 'test-only'))
        self.assertEqual(snapshot['top_comment']['translation']['text'], 'Translated')
        self.assertNotIn('translation_status', snapshot['top_comment'])

    def test_translation_without_key_or_already_detected_skips_request(self):
        with patch.object(tracker, 'urlopen') as fetch:
            self.assertFalse(tracker.enrich_translations([{'snapshots': [{'top_comment': {'text': 'Original'}}]}], None))
            self.assertFalse(tracker.enrich_translations([{'snapshots': [{'top_comment': {'text': 'Original', 'source_language': 'en'}}]}], 'test-only'))
            fetch.assert_not_called()

    def test_repeat_capture_does_not_replace_baseline(self):
        data = {'snapshots': [{'date': '2026-10-08', 'views': 100}]}
        tracker.save_snapshot(data, {'date': '2026-10-08', 'views': 150})
        self.assertEqual(data['snapshots'][0]['views'], 100)
        tracker.save_snapshot(data, {'date': '2026-10-07', 'views': 80})
        self.assertEqual([row['views'] for row in data['snapshots']], [80, 100])


if __name__ == '__main__':
    unittest.main()
