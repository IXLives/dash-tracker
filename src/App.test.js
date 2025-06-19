import { render, screen } from '@testing-library/react';
import App from './App';

test('renders DoorDash Tracker', () => {
  render(<App />);
  const linkElements = screen.getAllByText(/DoorDash Tracker/i);
  expect(linkElements.length).toBeGreaterThan(0);
  expect(linkElements[0]).toBeInTheDocument();
});