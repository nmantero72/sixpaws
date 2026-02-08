export interface Dog {
  id: string;
  userId: string;
  name: string;
  avatarBaseUrl?: string;
  avatarAdvancedUrl?: string; // premium, nullable
}
