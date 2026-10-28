import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMetaMaskReady } from './useMetaMaskReady';

function announce(rdns: string): void {
  window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: { info: { rdns } } }));
}

describe('useMetaMaskReady', () => {
  it('is not ready before MetaMask announces itself', () => {
    const { result } = renderHook(() => useMetaMaskReady());

    expect(result.current).toBe(false);
  });

  it('becomes ready when MetaMask announces itself', () => {
    const { result } = renderHook(() => useMetaMaskReady());

    act(() => announce('io.metamask'));

    expect(result.current).toBe(true);
  });

  it('ignores other wallets', () => {
    const { result } = renderHook(() => useMetaMaskReady());

    act(() => announce('com.phantom'));

    expect(result.current).toBe(false);
  });
});
