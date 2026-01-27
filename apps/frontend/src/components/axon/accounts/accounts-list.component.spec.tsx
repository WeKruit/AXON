import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the hooks
jest.mock('../hooks', () => ({
  useAccounts: jest.fn(),
  useAccountMutations: jest.fn(),
  useSouls: jest.fn(),
}));

jest.mock('@gitroom/react/toaster/toaster', () => ({
  useToaster: () => ({ show: jest.fn() }),
}));

jest.mock('@gitroom/react/helpers/delete.dialog', () => ({
  deleteDialog: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import { useAccounts, useAccountMutations, useSouls } from '../hooks';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { AccountsListComponent } from './accounts-list.component';

const mockAccounts = [
  {
    id: 'acc-1',
    soulId: 'soul-1',
    platform: 'twitter',
    username: 'testuser',
    displayName: 'Test User',
    purpose: 'content',
    status: 'active',
    warmupProgress: 75,
  },
  {
    id: 'acc-2',
    soulId: 'soul-1',
    platform: 'instagram',
    username: 'instauser',
    displayName: 'Insta User',
    purpose: 'engagement',
    status: 'warming',
    warmupProgress: 30,
  },
  {
    id: 'acc-3',
    soulId: 'soul-2',
    platform: 'linkedin',
    username: 'linkeduser',
    displayName: 'Linked User',
    purpose: 'amplification',
    status: 'suspended',
  },
];

const mockSouls = [
  { id: 'soul-1', name: 'Soul One' },
  { id: 'soul-2', name: 'Soul Two' },
];

describe('AccountsListComponent', () => {
  const mockDeleteAccount = jest.fn();
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAccounts as jest.Mock).mockReturnValue({
      data: mockAccounts,
      isLoading: false,
      mutate: mockMutate,
    });

    (useAccountMutations as jest.Mock).mockReturnValue({
      deleteAccount: mockDeleteAccount,
    });

    (useSouls as jest.Mock).mockReturnValue({
      data: mockSouls,
    });
  });

  describe('Rendering', () => {
    it('should render accounts list with all accounts', () => {
      render(<AccountsListComponent />);

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('instauser')).toBeInTheDocument();
      expect(screen.getByText('linkeduser')).toBeInTheDocument();
    });

    it('should show loading skeleton when loading', () => {
      (useAccounts as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        mutate: mockMutate,
      });

      const { container } = render(<AccountsListComponent />);

      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('should display the page title', () => {
      render(<AccountsListComponent />);

      expect(screen.getByText('Accounts')).toBeInTheDocument();
    });

    it('should show summary stats', () => {
      render(<AccountsListComponent />);

      // Total accounts
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Total Accounts')).toBeInTheDocument();
    });

    it('should show empty state when no accounts', () => {
      (useAccounts as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        mutate: mockMutate,
      });

      render(<AccountsListComponent />);

      expect(screen.getByText('No accounts found')).toBeInTheDocument();
    });

    it('should display soul name for each account', () => {
      render(<AccountsListComponent />);

      expect(screen.getByText('Soul One')).toBeInTheDocument();
      expect(screen.getByText('Soul Two')).toBeInTheDocument();
    });

    it('should link soul name to soul detail page', () => {
      render(<AccountsListComponent />);

      const soulLinks = screen.getAllByText('Soul One');
      const linkElement = soulLinks[0].closest('a');
      expect(linkElement).toHaveAttribute('href', '/axon/souls/soul-1');
    });
  });

  describe('Filtering', () => {
    it('should filter accounts by search query', () => {
      render(<AccountsListComponent />);

      const searchInput = screen.getByPlaceholderText('Search by username...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.queryByText('instauser')).not.toBeInTheDocument();
    });

    it('should show no match message when filters have no results', () => {
      render(<AccountsListComponent />);

      const searchInput = screen.getByPlaceholderText('Search by username...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No accounts match your filters')).toBeInTheDocument();
    });

    it('should render filter dropdowns', () => {
      render(<AccountsListComponent />);

      // Platform filter options
      expect(screen.getByText('All Platforms')).toBeInTheDocument();
      expect(screen.getByText('All Purposes')).toBeInTheDocument();
      expect(screen.getByText('All Statuses')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should have edit link for each account', () => {
      render(<AccountsListComponent />);

      const editLinks = screen.getAllByRole('link');
      const accountLinks = editLinks.filter(link =>
        (link as HTMLAnchorElement).href.includes('/axon/accounts/')
      );
      expect(accountLinks.length).toBeGreaterThan(0);
    });

    it('should call delete when confirmed', async () => {
      (deleteDialog as jest.Mock).mockResolvedValue(true);
      mockDeleteAccount.mockResolvedValue(undefined);
      mockMutate.mockResolvedValue(undefined);

      render(<AccountsListComponent />);

      // Find delete buttons (trash icons)
      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(deleteDialog).toHaveBeenCalled();
      });
    });

    it('should not delete when dialog cancelled', async () => {
      (deleteDialog as jest.Mock).mockResolvedValue(false);

      render(<AccountsListComponent />);

      const deleteButtons = screen.getAllByRole('button');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockDeleteAccount).not.toHaveBeenCalled();
      });
    });
  });

  describe('Warmup Progress', () => {
    it('should show warmup progress bar for accounts with warmup data', () => {
      render(<AccountsListComponent />);

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });
  });
});
