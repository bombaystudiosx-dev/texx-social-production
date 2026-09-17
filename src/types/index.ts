import { Timestamp, FieldValue } from "firebase/firestore";

export type AccountType = "personal" | "artist" | "business";
export type UserRole = "user" | "moderator" | "admin";
export type AccountStatus = "active" | "deactivated" | "suspended" | "banned";

export interface UserProfile {
  uid: string;
  username: string;
  usernameLower: string;
  displayName: string;
  displayNameLower: string;
  bio: string;
  website: string;
  photoURL: string;
  bannerURL: string;
  accountType: AccountType;
  role: UserRole;
  accountStatus: AccountStatus;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  dateOfBirth: string | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp | FieldValue;
}

/** Personal/Business use "Followers"; Artist accounts use "Fans". Same underlying graph. */
export function audienceLabel(accountType: AccountType | undefined): string {
  return accountType === "artist" ? "Fans" : "Followers";
}

export type PostStatus = "published" | "under_review" | "removed";

export interface PostMusic {
  provider: "apple_music" | "soundcloud" | "audiomack" | "other";
  trackUrl: string;
  title: string;
  artist: string;
  artworkUrl?: string | null;
  previewUrl?: string | null;
}

export interface Post {
  id: string;
  authorId: string;
  author: {
    username: string;
    displayName: string;
    photoURL: string;
  };
  text: string;
  imageURL: string | null;
  music: PostMusic | null;
  status: PostStatus;
  likesCount: number;
  repliesCount: number;
  repostsCount: number;
  commentsCount: number;
  createdAt: Timestamp;
  replyToId: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: {
    username: string;
    displayName: string;
    photoURL: string;
  };
  text: string;
  status: "published" | "removed";
  createdAt: Timestamp;
}

export interface Block {
  uid: string;
  createdAt: Timestamp;
}

export type ReportTargetType = "post" | "user" | "comment";
export type ReportStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: Timestamp;
  resolvedAt: Timestamp | null;
  resolvedBy: string | null;
}

export type NotificationType =
  | "follow"
  | "like"
  | "comment"
  | "message"
  | "share";

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorId: string;
  actor: {
    username: string;
    displayName: string;
    photoURL: string;
  };
  targetId: string | null;
  postId: string | null;
  conversationId: string | null;
  createdAt: Timestamp;
  read: boolean;
}
