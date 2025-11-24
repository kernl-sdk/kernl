import { AbstractPage, type PageParamsBase } from "./base";

export interface OffsetPageParams extends PageParamsBase {
  /**
   * Number of items to skip from the beginning of the collection.
   */
  offset?: number;
}

export interface OffsetPageResponse<T> {
  data: T[];
  offset: number;
  limit: number;
  /**
   * Optional total count when the underlying store can provide it.
   */
  total?: number;
}

export class OffsetPage<
  T,
  TParams extends OffsetPageParams = OffsetPageParams,
> extends AbstractPage<T, TParams, OffsetPageResponse<T>> {
  data: T[];
  offset: number;
  limit: number;
  total?: number;

  constructor(args: {
    params: TParams;
    response: OffsetPageResponse<T>;
    loader: (params: TParams) => Promise<OffsetPageResponse<T>>;
  }) {
    super(args);
    this.data = args.response.data ?? [];
    this.offset = args.response.offset;
    this.limit = args.response.limit;
    this.total = args.response.total;
  }

  /**
   * All items contained in this page.
   */
  get items(): T[] {
    return this.data;
  }

  /**
   * True if this is the last page in the sequence.
   *
   * When `last` is true, `next()` will return null.
   */
  get last(): boolean {
    if (this.data.length === 0) {
      return true;
    }

    const next = (this.offset ?? 0) + (this.limit ?? 0);
    if (this.total != null && next >= this.total) {
      return true;
    }

    return false;
  }

  /**
   * Fetch the next page, or null if there is no next page.
   */
  async next(): Promise<this | null> {
    if (this.last) {
      return null;
    }

    const next = (this.offset ?? 0) + (this.limit ?? 0);
    const nextParams: TParams = {
      ...(this.params as TParams),
      offset: next,
    };

    const res = await this.loader(nextParams);
    const page = new OffsetPage<T, TParams>({
      params: nextParams,
      response: res,
      loader: this.loader,
    }) as this;

    return page;
  }
}
