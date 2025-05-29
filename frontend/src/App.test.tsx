import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  test('should render without crashing', () => {
    render(<App />);
    // This test should pass once we have a basic working App component
  });

  test('should display application title', () => {
    render(<App />);
    // We expect to see "OSINT Platform" somewhere on the page
    expect(screen.getByText(/OSINT Platform/i)).toBeInTheDocument();
  });

  test('should have proper routing foundation', () => {
    render(<App />);
    // We expect the app to have routing capabilities
    // This will fail initially until we implement React Router
    expect(document.querySelector('[data-testid="router"]')).toBeInTheDocument();
  });
}); 