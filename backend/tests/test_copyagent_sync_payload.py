import unittest

from main import _build_copyagent_user_payload


class CopyAgentPayloadTests(unittest.TestCase):
    def test_builds_agency_plan_payload(self):
        payload = _build_copyagent_user_payload(
            user_id="u-1",
            email="new.user@example.com",
            name="New User",
            password_hash="hash",
            auth_provider="email",
            google_id=None,
            profile_picture=None,
        )

        self.assertEqual(payload["plan_type"], "agency")
        self.assertEqual(payload["plan_name"], "agency")
        self.assertEqual(payload["email"], "new.user@example.com")


if __name__ == "__main__":
    unittest.main()
