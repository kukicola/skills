export interface Comment {
  file: string;
  line: number;
  side: 'old' | 'new';
  body: string;
}

export interface FileEntry {
  path: string;
  language: string;
  patches: string[];
}

export interface Section {
  title: string;
  description: string;
  priority: number;
  comments: Comment[];
  files: FileEntry[];
}

export interface ReviewData {
  title: string;
  base_ref: string;
  head_ref: string;
  sections: Section[];
}

export interface UserComment {
  id: string;
  file: string;
  line: number;
  side: 'additions' | 'deletions';
  text: string;
}
