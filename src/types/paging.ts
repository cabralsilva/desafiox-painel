export interface IPaging {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export interface IPagingResult<T> {
  items: T[];
  paging: IPaging;
}
