export interface PageParamsBase {
  /**
   * Maximum number of items to return in a single page.
   */
  limit?: number;
}

/**
 * Generic page abstraction shared by all pagination modes.
 *
 * Loader: function that, given params, returns a page response.
 */
export abstract class AbstractPage<T, TParams extends PageParamsBase, TResponse>
  implements AsyncIterable<T>
{
  protected readonly params: TParams;
  protected readonly response: TResponse;
  protected readonly loader: (params: TParams) => Promise<TResponse>;

  constructor(args: {
    params: TParams;
    response: TResponse;
    loader: (params: TParams) => Promise<TResponse>;
  }) {
    this.params = args.params;
    this.response = args.response;
    this.loader = args.loader;
  }

  /**
   * All items contained in this page.
   */
  abstract get items(): T[];

  /**
   * True if this is the last page in the sequence.
   *
   * When `last` is true, `next()` will return null.
   */
  abstract get last(): boolean;

  /**
   * Fetch the next page, or null if there is no next page.
   */
  abstract next(): Promise<this | null>;

  /**
   * Iterate over this page and all subsequent pages.
   */
  async *pages(): AsyncGenerator<this> {
    let page: this | null = this;
    while (page) {
      yield page;
      page = await page.next();
    }
  }

  /**
   * Iterate over all items across this page and all subsequent pages.
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    for await (const page of this.pages()) {
      for (const item of page.items) {
        yield item;
      }
    }
  }

  /**
   * Collect all items from this page and all subsequent pages into an array.
   */
  async collect(): Promise<T[]> {
    const items: T[] = [];
    for await (const item of this) {
      items.push(item);
    }
    return items;
  }
}
