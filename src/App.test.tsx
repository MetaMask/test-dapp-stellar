import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { App } from './App';

test('renders connect button', () => {
  render(<App />);
  const button = screen.getByText(/Connect Wallet/iu);
  expect(button).toBeDefined();
});
