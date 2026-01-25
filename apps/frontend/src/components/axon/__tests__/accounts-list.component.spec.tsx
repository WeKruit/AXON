import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountsList } from '../accounts/accounts-list.component';
import { useAccounts } from '../hooks/use-axon-api';

// Mock the useAccounts hook
jest.mock('../hooks/use-axon-api', () => ({
  useAccounts: jest.fn(),
}));

const mockUseAccounts = useAccounts as jest.MockedFunction<typeof useAccounts>;

describe('AccountsList', () => {
  const mockAccounts = [
    {
      id: '1',
      platform: 'twitter',
      username: 'john_doe',
      status: 'active' as const,
      soulId: 'soul-1',
      proxyId: 'proxy-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      platform: 'linkedin',
      username: 'jane_smith',
      status: 'warming' as const,
      soulId: 'soul-2',
      proxyId: 'proxy-2',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      platform: 'instagram',
      username: 'brand_account',
      status: 'suspended' as const,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading spinner when data is loading', () => {
      mockUseAccounts.mockReturnValue({
        accounts: undefined,
        data: undefined,
        isLoading: true,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList />);

      expect(screen.getByRole('status', { name: /loading accounts/i })).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error message when there is an error', () => {
      const mockMutate = jest.fn();
      mockUseAccounts.mockReturnValue({
        accounts: undefined,
        data: undefined,
        isLoading: false,
        error: { message: 'Failed to fetch accounts', name: 'ApiError', status: 500 },
        mutate: mockMutate,
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch accounts')).toBeInTheDocument();
    });

    it('should call mutate when retry button is clicked', () => {
      const mockMutate = jest.fn();
      mockUseAccounts.mockReturnValue({
        accounts: undefined,
        data: undefined,
        isLoading: false,
        error: { message: 'Failed to fetch accounts', name: 'ApiError', status: 500 },
        mutate: mockMutate,
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no accounts exist', () => {
      mockUseAccounts.mockReturnValue({
        accounts: [],
        data: [],
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList />);

      expect(screen.getByText(/no accounts found/i)).toBeInTheDocument();
    });
  });

  describe('Data Rendering', () => {
    it('should render list of accounts', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList />);

      expect(screen.getByText('john_doe')).toBeInTheDocument();
      expect(screen.getByText('jane_smith')).toBeInTheDocument();
      expect(screen.getByText('brand_account')).toBeInTheDocument();
    });

    it('should display account platforms', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList />);

      expect(screen.getByText(/twitter/i)).toBeInTheDocument();
      expect(screen.getByText(/linkedin/i)).toBeInTheDocument();
      expect(screen.getByText(/instagram/i)).toBeInTheDocument();
    });

    it('should display status badges', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Warming')).toBeInTheDocument();
      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter accounts by status', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList filterStatus="active" />);

      expect(screen.getByText('john_doe')).toBeInTheDocument();
      expect(screen.queryByText('jane_smith')).not.toBeInTheDocument();
      expect(screen.queryByText('brand_account')).not.toBeInTheDocument();
    });

    it('should show empty state when filter returns no results', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList filterStatus="inactive" />);

      expect(screen.getByText(/no accounts found/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onSelect when an account card is clicked', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      const onSelect = jest.fn();
      render(<AccountsList onSelect={onSelect} />);

      const accountCard = screen.getByRole('button', { name: /select account: john_doe on twitter/i });
      fireEvent.click(accountCard);

      expect(onSelect).toHaveBeenCalledWith(mockAccounts[0]);
    });

    it('should call onEdit when edit button is clicked', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      const onEdit = jest.fn();
      render(<AccountsList onEdit={onEdit} />);

      const editButtons = screen.getAllByRole('button', { name: /edit account/i });
      fireEvent.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalledWith(mockAccounts[0]);
    });

    it('should call onDelete when delete button is clicked', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      const onDelete = jest.fn();
      render(<AccountsList onDelete={onDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete account/i });
      fireEvent.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalledWith(mockAccounts[0]);
    });

    it('should support keyboard navigation with Enter key', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      const onSelect = jest.fn();
      render(<AccountsList onSelect={onSelect} />);

      const accountCard = screen.getByRole('button', { name: /select account: john_doe on twitter/i });
      fireEvent.keyDown(accountCard, { key: 'Enter' });

      expect(onSelect).toHaveBeenCalledWith(mockAccounts[0]);
    });

    it('should support keyboard navigation with Space key', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      const onSelect = jest.fn();
      render(<AccountsList onSelect={onSelect} />);

      const accountCard = screen.getByRole('button', { name: /select account: john_doe on twitter/i });
      fireEvent.keyDown(accountCard, { key: ' ' });

      expect(onSelect).toHaveBeenCalledWith(mockAccounts[0]);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for list', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList />);

      expect(screen.getByRole('list', { name: /list of accounts/i })).toBeInTheDocument();
    });

    it('should have proper ARIA labels for edit buttons', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList onEdit={jest.fn()} />);

      expect(screen.getByRole('button', { name: /edit account: john_doe/i })).toBeInTheDocument();
    });

    it('should have proper ARIA labels for delete buttons', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList onDelete={jest.fn()} />);

      expect(screen.getByRole('button', { name: /delete account: john_doe/i })).toBeInTheDocument();
    });

    it('should have focusable account cards', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList />);

      const accountCard = screen.getByRole('button', { name: /select account: john_doe on twitter/i });
      expect(accountCard).toHaveAttribute('tabIndex', '0');
    });

    it('should have status badges with proper ARIA labels', () => {
      mockUseAccounts.mockReturnValue({
        accounts: mockAccounts,
        data: mockAccounts,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
        createAccount: jest.fn(),
        updateAccount: jest.fn(),
        deleteAccount: jest.fn(),
      } as any);

      render(<AccountsList />);

      const statusBadges = screen.getAllByRole('status', { name: /account status/i });
      expect(statusBadges.length).toBeGreaterThan(0);
    });
  });
});
