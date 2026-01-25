import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SoulsList } from '../souls/souls-list.component';
import { useSouls } from '../hooks/use-axon-api';

// Mock the useSouls hook
jest.mock('../hooks/use-axon-api', () => ({
  useSouls: jest.fn(),
}));

const mockUseSouls = useSouls as jest.MockedFunction<typeof useSouls>;

describe('SoulsList', () => {
  const mockSouls = [
    {
      id: '1',
      name: 'Marketing Maven',
      description: 'A professional marketing persona',
      voice: 'Professional',
      tone: 'Enthusiastic',
      personality: 'Friendly',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Tech Expert',
      description: 'Technical thought leader',
      voice: 'Authoritative',
      tone: 'Informative',
      personality: 'Analytical',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading spinner when data is loading', () => {
      mockUseSouls.mockReturnValue({
        souls: undefined,
        data: undefined,
        isLoading: true,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      render(<SoulsList />);

      expect(screen.getByRole('status', { name: /loading souls/i })).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error message when there is an error', () => {
      const mockMutate = jest.fn();
      mockUseSouls.mockReturnValue({
        souls: undefined,
        data: undefined,
        isLoading: false,
        error: { message: 'Failed to fetch souls', name: 'ApiError', status: 500 },
        mutate: mockMutate,
        isValidating: false,
      } as any);

      render(<SoulsList />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch souls')).toBeInTheDocument();
    });

    it('should call mutate when retry button is clicked', () => {
      const mockMutate = jest.fn();
      mockUseSouls.mockReturnValue({
        souls: undefined,
        data: undefined,
        isLoading: false,
        error: { message: 'Failed to fetch souls', name: 'ApiError', status: 500 },
        mutate: mockMutate,
        isValidating: false,
      } as any);

      render(<SoulsList />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no souls exist', () => {
      mockUseSouls.mockReturnValue({
        souls: [],
        data: [],
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      render(<SoulsList />);

      expect(screen.getByText(/no souls found/i)).toBeInTheDocument();
    });
  });

  describe('Data Rendering', () => {
    it('should render list of souls', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      render(<SoulsList />);

      expect(screen.getByText('Marketing Maven')).toBeInTheDocument();
      expect(screen.getByText('Tech Expert')).toBeInTheDocument();
    });

    it('should display soul descriptions', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      render(<SoulsList />);

      expect(screen.getByText('A professional marketing persona')).toBeInTheDocument();
      expect(screen.getByText('Technical thought leader')).toBeInTheDocument();
    });

    it('should display voice and tone badges', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      render(<SoulsList />);

      expect(screen.getByText(/voice: professional/i)).toBeInTheDocument();
      expect(screen.getByText(/tone: enthusiastic/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onSelect when a soul card is clicked', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      const onSelect = jest.fn();
      render(<SoulsList onSelect={onSelect} />);

      const soulCard = screen.getByRole('button', { name: /select soul: marketing maven/i });
      fireEvent.click(soulCard);

      expect(onSelect).toHaveBeenCalledWith(mockSouls[0]);
    });

    it('should call onEdit when edit button is clicked', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      const onEdit = jest.fn();
      render(<SoulsList onEdit={onEdit} />);

      const editButtons = screen.getAllByRole('button', { name: /edit soul/i });
      fireEvent.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalledWith(mockSouls[0]);
    });

    it('should call onDelete when delete button is clicked', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      const onDelete = jest.fn();
      render(<SoulsList onDelete={onDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete soul/i });
      fireEvent.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalledWith(mockSouls[0]);
    });

    it('should support keyboard navigation with Enter key', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      const onSelect = jest.fn();
      render(<SoulsList onSelect={onSelect} />);

      const soulCard = screen.getByRole('button', { name: /select soul: marketing maven/i });
      fireEvent.keyDown(soulCard, { key: 'Enter' });

      expect(onSelect).toHaveBeenCalledWith(mockSouls[0]);
    });

    it('should support keyboard navigation with Space key', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      const onSelect = jest.fn();
      render(<SoulsList onSelect={onSelect} />);

      const soulCard = screen.getByRole('button', { name: /select soul: marketing maven/i });
      fireEvent.keyDown(soulCard, { key: ' ' });

      expect(onSelect).toHaveBeenCalledWith(mockSouls[0]);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for list', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      render(<SoulsList />);

      expect(screen.getByRole('list', { name: /list of souls/i })).toBeInTheDocument();
    });

    it('should have proper ARIA labels for edit buttons', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      render(<SoulsList onEdit={jest.fn()} />);

      expect(screen.getByRole('button', { name: /edit soul: marketing maven/i })).toBeInTheDocument();
    });

    it('should have proper ARIA labels for delete buttons', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      render(<SoulsList onDelete={jest.fn()} />);

      expect(screen.getByRole('button', { name: /delete soul: marketing maven/i })).toBeInTheDocument();
    });

    it('should have focusable soul cards', () => {
      mockUseSouls.mockReturnValue({
        souls: mockSouls,
        data: mockSouls,
        isLoading: false,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      } as any);

      render(<SoulsList />);

      const soulCard = screen.getByRole('button', { name: /select soul: marketing maven/i });
      expect(soulCard).toHaveAttribute('tabIndex', '0');
    });
  });
});
