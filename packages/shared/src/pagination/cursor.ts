/**
 * Cursor-based pagination.
 */

import { AbstractPage, type PageParamsBase } from "./base";

export interface CursorPageParams extends PageParamsBase {
  /**
   * Pagination cursor returned from a previous page.
   * If omitted, starts from the beginning of the collection.
   */
  cursor?: string;
}

export interface CursorPageResponse<T> {
  data: T[];
  /**
   * Cursor for the next page, or null if there is no next page.
   */
  next: string | null;
  /**
   * True if this is the last page (no further pages).
   */
  last: boolean;
}

export class CursorPage<
  T,
  TParams extends CursorPageParams = CursorPageParams,
> extends AbstractPage<T, TParams, CursorPageResponse<T>> {
  data: T[];
  private readonly _next: string | null;
  private readonly _last: boolean;

  constructor(args: {
    params: TParams;
    response: CursorPageResponse<T>;
    loader: (params: TParams) => Promise<CursorPageResponse<T>>;
  }) {
    super(args);
    this.data = args.response.data ?? [];
    this._next = args.response.next;
    this._last = args.response.last;
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
    if (this._last) return true;
    if (!this._next) return true;
    return this.data.length === 0;
  }

  /**
   * Cursor for the next page, or null if this is the last page.
   */
  get nextCursor(): string | null {
    return this.last ? null : this._next;
  }

  /**
   * Fetch the next page, or null if there is no next page.
   */
  async next(): Promise<this | null> {
    if (this.last) {
      return null;
    }

    if (!this._next) {
      return null;
    }

    const nextParams: TParams = {
      ...(this.params as TParams),
      cursor: this._next,
    };

    const res = await this.loader(nextParams);
    const page = new CursorPage<T, TParams>({
      params: nextParams,
      response: res,
      loader: this.loader,
    }) as this;

    return page;
  }
}
