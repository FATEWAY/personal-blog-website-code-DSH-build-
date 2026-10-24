export type PostStatus = "draft" | "published";

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage: string | null;
  status: PostStatus;
  category: Category | null;
  tags: Tag[];
  readingMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostDetail = PostSummary & {
  content: string;
};

export type PostListResult = {
  posts: PostSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdjacentPosts = {
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

export type CategoryWithCount = Category & { count: number };
export type TagWithCount = Tag & { count: number };

export type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  tech: string[];
  coverImage: string | null;
  demoUrl: string | null;
  repoUrl: string | null;
  sortOrder: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GalleryItem = {
  id: string;
  imageUrl: string;
  category: string;
  caption: string;
  note: string;
  sortOrder: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminAccount = {
  id: string;
  username: string;
  displayName: string;
  lastLoginAt: string | null;
};

export type DashboardStats = {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalProjects: number;
  totalCategories: number;
  totalTags: number;
  recentUpdated: PostSummary[];
  recentPublished: PostSummary[];
};

export type SiteSettings = {
  siteName: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  contactEmail: string;
  footerNote: string;
  brand: {
    logoUrl: string;
    mark: string;
    subtitle: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  profile: {
    name: string;
    role: string;
    location: string;
    bio: string[];
    focus: string[];
    principles: { title: string; body: string }[];
    principlesTitle: string;
  };
  skills: { category: string; items: string[] }[];
  socials: { label: string; url: string }[];
};

export type SessionRecord = {
  tokenHash: string;
  adminId: string;
  csrfToken: string;
  createdAt: string;
  expiresAt: string;
};

export type AuthSession = {
  session: SessionRecord;
  admin: AdminAccount;
};
