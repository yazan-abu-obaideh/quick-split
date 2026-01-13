import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app title', () => {
  render(<App />);
  const titleElements = screen.getAllByText(/Quick Split/i);
  expect(titleElements.length).toBeGreaterThan(0);
});

test('renders enter bill button', () => {
  render(<App />);
  const button = screen.getByText(/Enter Bill/i);
  expect(button).toBeInTheDocument();
});
