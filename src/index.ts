function releaseStub() {}

/**
 * A simple mutual exclusion lock. It allows you to obtain and release a lock,
 *  ensuring that only one task can access a critical section at a time.
 */
export class Mutex {
  private m_lastPromise: Promise<void> = Promise.resolve();

  /**
   * Acquire lock
   * @param [bypass=false] option to skip lock acquisition
   */
  public async obtain(bypass = false): Promise<() => void> {
    let release = releaseStub;
    if (bypass) return release;
    const lastPromise = this.m_lastPromise;
    this.m_lastPromise = new Promise<void>(resolve => (release = resolve));
    await lastPromise;
    return release;
  }

  /**
   * Creates a lock object that can be used with the `using` statement.
   * The `using` statement ensures that the lock is released even if an error occurs within the block.
   *
   * @returns An object with a `Symbol.dispose` method that releases the lock when called.
   *
   * @example
   * ```typescript
   * async function main() {
   *   const mutex = new Mutex();
   *   {
   *     using _ = await mutex.lock();
   *     // Critical section
   *     // The lock is automatically released when the block exits
   *   }
   * }
   * ```
   */
  public async lock(bypass = false) {
    return {
      [Symbol.dispose]: await this.obtain(bypass),
    };
  }
}

/**
 * A mutual exclusion lock that supports multiple readers or a single writer.
 *  Readers can obtain a read lock simultaneously, but writers must wait until all readers release the lock.
 *  It helps in scenarios where you want to optimize concurrent read operations but ensure exclusive write access.
 */
export class MutexRW {
  private m_nextRWPromise: Promise<void> = Promise.resolve();
  private m_lastRWPromise: Promise<void> = Promise.resolve();
  private m_lastROPromise: Promise<unknown> = Promise.resolve();
  private roAccessCnt = 0;
  private rwAccess = false;

  /**
   * Acquire read lock
   */
  public async obtainRO(): Promise<() => void> {
    while (this.rwAccess) await this.m_lastRWPromise;
    ++this.roAccessCnt;
    let releaseRO = releaseStub;
    const thisROPromise = new Promise<void>(resolve => (releaseRO = resolve));
    this.m_lastROPromise = Promise.all([thisROPromise, this.m_lastROPromise]);
    thisROPromise.then(() => --this.roAccessCnt);
    // Uncomment to detect deadlocks
    // const s = new Error().stack;
    // Promise.race([thisROPromise, timeout(10000).then(() => true)]).then(
    //   v => v === true && console.warn('possible deadlock', s),
    // );
    return releaseRO;
  }

  /**
   * Creates a read lock object that can be used with the `using` statement.
   * The `using` statement ensures that the lock is released even if an error occurs within the block.
   *
   * @returns An object with a `Symbol.dispose` method that releases the lock when called.
   *
   * @example
   * ```typescript
   * async function main() {
   *   const mutex = new MutexRW();
   *   {
   *     using _ = await mutex.lockRO();
   *     // Critical section
   *     // The lock is automatically released when the block exits
   *   }
   * }
   * ```
   */
  public async lockRO() {
    return {
      [Symbol.dispose]: await this.obtainRO(),
    };
  }

  /**
   * Acquire write lock
   */
  public async obtainRW(): Promise<() => void> {
    let releaseRW = releaseStub;
    const prevRWPromise = this.m_nextRWPromise;
    const thisRWPromise = new Promise<void>(resolve => (releaseRW = resolve));
    this.m_nextRWPromise = thisRWPromise;
    await prevRWPromise;
    while (this.roAccessCnt) await this.m_lastROPromise;
    this.rwAccess = true;
    this.m_lastRWPromise = thisRWPromise;
    this.m_lastRWPromise.then(() => (this.rwAccess = false));
    return releaseRW;
  }

  /**
   * Creates a write lock object that can be used with the `using` statement.
   * The `using` statement ensures that the lock is released even if an error occurs within the block.
   *
   * @returns An object with a `Symbol.dispose` method that releases the lock when called.
   *
   * @example
   * ```typescript
   * async function main() {
   *   const mutex = new MutexRW();
   *   {
   *     using _ = await mutex.lockRW();
   *     // Critical section
   *     // The lock is automatically released when the block exits
   *   }
   * }
   * ```
   */
  public async lockRW() {
    return {
      [Symbol.dispose]: await this.obtainRW(),
    };
  }
}
