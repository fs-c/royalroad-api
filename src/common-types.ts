export interface FictionBlurb {
  id: number;
  type: string;
  title: string;
  image: string;
  tags: string[];
}

export interface LatestBlurb extends FictionBlurb {
  latest: {
    name: string;
    link: string;
    created: number;
  }[];
}

export interface PopularBlurb extends FictionBlurb {
  description: string;
  stats: {
    pages: number;
    latest: number;
    rating: number;
    chapters: number;
    followers: number;
  };
}

export type BestBlurb = PopularBlurb;

export interface SearchBlurb {
  id: number;
  pages: number;
  title: string;
  image: string;
  author: string;
  description: string;
}

export interface Fiction {
  type: string;
  title: string;
  image: string;
  status: string;
  tags: string[];
  warnings: string[];
  description: string;
  stats: FictionStats;
  author: FictionAuthor;
}

export interface FictionStats {
  pages: number;
  ratings: number;
  favorites: number;
  followers: number;
  views: {
    total: number;
    average: number;
  };
  score: {
    style: number;
    story: number;
    grammar: number;
    overall: number;
    character: number;
  };
}

export interface FictionAuthor {
  id: number;
  name: string;
  title: string;
  avatar: string;
}
