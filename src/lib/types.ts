export type Side = "for" | "against";

export type User = {
  id: string;
  displayName: string;
  createdAt: number;
};

export type Evidence = {
  id: string;
  filingId: string;
  kind: "image" | "link";
  url: string;
  caption: string | null;
  createdAt: number;
};

export type Filing = {
  id: string;
  debateId: string;
  side: Side;
  body: string;
  createdAt: number;
  updatedAt: number;
  author: { id: string; displayName: string };
  votes: number;
  hasVoted: boolean;
  evidence: Evidence[];
};

export type Debate = {
  id: string;
  caseNo: number;
  title: string;
  statement: string;
  forLabel: string;
  againstLabel: string;
  createdAt: number;
  creator: { id: string; displayName: string };
};

export type DebateDetail = Debate & {
  filings: Filing[];
  forVotes: number;
  againstVotes: number;
};

export type DocketEntry = Debate & {
  filingCount: number;
  forVotes: number;
  againstVotes: number;
};
