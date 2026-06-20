"""One-off script to bring an already-existing lifeblood_db up to date with
the current models.py, without having to drop and re-import lifeblood_db.sql."""
from sqlalchemy import text

from app.database import engine

STATEMENTS = [
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `chat_enabled` tinyint(1) NOT NULL DEFAULT 1",
    """
    CREATE TABLE IF NOT EXISTS `donation_requests` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `seeker_id` int(11) NOT NULL,
      `blood_group` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
      `division` varchar(100) NOT NULL,
      `district` varchar(100) NOT NULL,
      `upazila` varchar(100) NOT NULL,
      `deadline` datetime NOT NULL,
      `status` enum('open','fulfilled','cancelled') NOT NULL DEFAULT 'open',
      `notes` text DEFAULT NULL,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      KEY `seeker_id` (`seeker_id`),
      KEY `idx_donation_requests_match` (`blood_group`,`division`,`district`,`upazila`,`status`),
      CONSTRAINT `donation_requests_ibfk_1` FOREIGN KEY (`seeker_id`) REFERENCES `users` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS `request_notifications` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `request_id` int(11) NOT NULL,
      `donor_id` int(11) NOT NULL,
      `status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      `responded_at` datetime DEFAULT NULL,
      PRIMARY KEY (`id`),
      KEY `request_id` (`request_id`),
      KEY `donor_id` (`donor_id`),
      CONSTRAINT `request_notifications_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `donation_requests` (`id`),
      CONSTRAINT `request_notifications_ibfk_2` FOREIGN KEY (`donor_id`) REFERENCES `users` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS `messages` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `sender_id` int(11) NOT NULL,
      `receiver_id` int(11) NOT NULL,
      `message_type` enum('text','location') NOT NULL DEFAULT 'text',
      `content` text DEFAULT NULL,
      `latitude` double DEFAULT NULL,
      `longitude` double DEFAULT NULL,
      `is_read` tinyint(1) NOT NULL DEFAULT 0,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      KEY `idx_messages_sender` (`sender_id`),
      KEY `idx_messages_receiver` (`receiver_id`),
      KEY `idx_messages_created` (`created_at`),
      CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
      CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    """,
    """
    CREATE TABLE IF NOT EXISTS `blocked_users` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `blocker_id` int(11) NOT NULL,
      `blocked_id` int(11) NOT NULL,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      UNIQUE KEY `idx_blocked_users_pair` (`blocker_id`,`blocked_id`),
      KEY `blocked_id` (`blocked_id`),
      CONSTRAINT `blocked_users_ibfk_1` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`id`),
      CONSTRAINT `blocked_users_ibfk_2` FOREIGN KEY (`blocked_id`) REFERENCES `users` (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    """,
]

with engine.begin() as conn:
    for statement in STATEMENTS:
        conn.execute(text(statement))
        print("OK:", statement.strip().splitlines()[0])

print("Schema is up to date.")
