import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MatrixGrid, MatrixGridProps } from './matrix-grid.component';

// Mock child components
jest.mock('./matrix-cell.component', () => ({
  MatrixCell: ({ soulId, integrationId, mapping, onToggle, onSetPrimary }: any) => (
    <div
      data-testid={`cell-${soulId}-${integrationId}`}
      data-connected={!!mapping}
      data-primary={mapping?.isPrimary ?? false}
    >
      <button
        data-testid={`toggle-${soulId}-${integrationId}`}
        onClick={() => onToggle(soulId, integrationId)}
      >
        Toggle
      </button>
      <button
        data-testid={`primary-${soulId}-${integrationId}`}
        onClick={() => onSetPrimary(soulId, integrationId)}
      >
        SetPrimary
      </button>
    </div>
  ),
  MatrixHeaderCell: ({ label, type }: any) => (
    <div data-testid={`header-${type}-${label}`}>{label}</div>
  ),
  MatrixCellSkeleton: () => <div data-testid="cell-skeleton" />,
}));

jest.mock('../ui/icons', () => ({
  CheckIcon: () => <span>check</span>,
  GridIcon: ({ size, className }: any) => <span data-testid="grid-icon">grid</span>,
  StarFilledIcon: () => <span>star</span>,
  LinkIcon: () => <span>link</span>,
  UnlinkIcon: () => <span>unlink</span>,
}));

const mockSouls = [
  { id: 'soul-1', name: 'Soul One', persona: { name: 'Persona A' } },
  { id: 'soul-2', name: 'Soul Two', persona: null },
];

const mockIntegrations = [
  { id: 'int-1', name: '@twitter_acc', type: 'social', identifier: 'twitter', picture: null },
  { id: 'int-2', name: '@insta_acc', type: 'social', identifier: 'instagram', picture: null },
];

const mockMappings = [
  {
    id: 'map-1',
    soulId: 'soul-1',
    integrationId: 'int-1',
    organizationId: 'org-1',
    isPrimary: true,
    priority: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'map-2',
    soulId: 'soul-1',
    integrationId: 'int-2',
    organizationId: 'org-1',
    isPrimary: false,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockData = {
  souls: mockSouls,
  integrations: mockIntegrations,
  mappings: mockMappings,
  stats: { totalSouls: 2, totalIntegrations: 2, totalMappings: 2 },
};

const defaultProps: MatrixGridProps = {
  data: mockData,
  isLoading: false,
  onToggleMapping: jest.fn().mockResolvedValue(undefined),
  onSetPrimary: jest.fn().mockResolvedValue(undefined),
};

describe('MatrixGrid Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Grid Structure', () => {
    it('should render souls as rows', () => {
      render(<MatrixGrid {...defaultProps} />);

      expect(screen.getByTestId('header-soul-Soul One')).toBeInTheDocument();
      expect(screen.getByTestId('header-soul-Soul Two')).toBeInTheDocument();
    });

    it('should render integrations as column headers', () => {
      render(<MatrixGrid {...defaultProps} />);

      expect(screen.getByTestId('header-integration-@twitter_acc')).toBeInTheDocument();
      expect(screen.getByTestId('header-integration-@insta_acc')).toBeInTheDocument();
    });

    it('should render cells for each soul-integration pair', () => {
      render(<MatrixGrid {...defaultProps} />);

      expect(screen.getByTestId('cell-soul-1-int-1')).toBeInTheDocument();
      expect(screen.getByTestId('cell-soul-1-int-2')).toBeInTheDocument();
      expect(screen.getByTestId('cell-soul-2-int-1')).toBeInTheDocument();
      expect(screen.getByTestId('cell-soul-2-int-2')).toBeInTheDocument();
    });

    it('should show connected status for cells with mappings', () => {
      render(<MatrixGrid {...defaultProps} />);

      // soul-1 is connected to both int-1 and int-2
      expect(screen.getByTestId('cell-soul-1-int-1')).toHaveAttribute('data-connected', 'true');
      expect(screen.getByTestId('cell-soul-1-int-2')).toHaveAttribute('data-connected', 'true');

      // soul-2 is not connected to anything
      expect(screen.getByTestId('cell-soul-2-int-1')).toHaveAttribute('data-connected', 'false');
      expect(screen.getByTestId('cell-soul-2-int-2')).toHaveAttribute('data-connected', 'false');
    });

    it('should show primary status for primary mappings', () => {
      render(<MatrixGrid {...defaultProps} />);

      expect(screen.getByTestId('cell-soul-1-int-1')).toHaveAttribute('data-primary', 'true');
      expect(screen.getByTestId('cell-soul-1-int-2')).toHaveAttribute('data-primary', 'false');
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no souls exist', () => {
      render(
        <MatrixGrid
          {...defaultProps}
          data={{ ...mockData, souls: [] }}
        />
      );

      expect(screen.getByText('No Data to Display')).toBeInTheDocument();
      expect(screen.getByText(/Create some Souls first/)).toBeInTheDocument();
    });

    it('should show empty state when no integrations exist', () => {
      render(
        <MatrixGrid
          {...defaultProps}
          data={{ ...mockData, integrations: [] }}
        />
      );

      expect(screen.getByText('No Data to Display')).toBeInTheDocument();
      expect(screen.getByText(/Connect some social channels first/)).toBeInTheDocument();
    });

    it('should show empty state when data is null', () => {
      render(
        <MatrixGrid
          {...defaultProps}
          data={null}
        />
      );

      expect(screen.getByText('No Data to Display')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      render(
        <MatrixGrid
          {...defaultProps}
          isLoading={true}
        />
      );

      expect(screen.queryByTestId('cell-soul-1-int-1')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onToggleMapping when cell is toggled', async () => {
      render(<MatrixGrid {...defaultProps} />);

      fireEvent.click(screen.getByTestId('toggle-soul-2-int-1'));

      expect(defaultProps.onToggleMapping).toHaveBeenCalledWith('soul-2', 'int-1');
    });

    it('should call onSetPrimary when primary is set', async () => {
      render(<MatrixGrid {...defaultProps} />);

      fireEvent.click(screen.getByTestId('primary-soul-1-int-2'));

      expect(defaultProps.onSetPrimary).toHaveBeenCalledWith('soul-1', 'int-2');
    });
  });

  describe('Legend', () => {
    it('should render legend with connection states', () => {
      render(<MatrixGrid {...defaultProps} />);

      expect(screen.getByText('Not Connected')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Primary')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter souls when soulId filter applied', () => {
      render(
        <MatrixGrid
          {...defaultProps}
          filters={{ soulId: 'soul-1' }}
        />
      );

      expect(screen.getByTestId('header-soul-Soul One')).toBeInTheDocument();
      expect(screen.queryByTestId('header-soul-Soul Two')).not.toBeInTheDocument();
    });

    it('should filter integrations when integrationId filter applied', () => {
      render(
        <MatrixGrid
          {...defaultProps}
          filters={{ integrationId: 'int-1' }}
        />
      );

      expect(screen.getByTestId('header-integration-@twitter_acc')).toBeInTheDocument();
      expect(screen.queryByTestId('header-integration-@insta_acc')).not.toBeInTheDocument();
    });

    it('should show no-match empty state when filters exclude everything', () => {
      render(
        <MatrixGrid
          {...defaultProps}
          filters={{ soulId: 'nonexistent' }}
        />
      );

      expect(screen.getByText('No Data to Display')).toBeInTheDocument();
      expect(screen.getByText(/No items match your current filters/)).toBeInTheDocument();
    });
  });

  describe('Bulk Mode', () => {
    const bulkProps = {
      ...defaultProps,
      onBulkConnect: jest.fn().mockResolvedValue(undefined),
      onBulkDisconnect: jest.fn().mockResolvedValue(undefined),
    };

    it('should show bulk mode toggle when bulk handlers provided', () => {
      render(<MatrixGrid {...bulkProps} />);

      expect(screen.getByText('Bulk Mode')).toBeInTheDocument();
    });

    it('should not show bulk mode toggle when no bulk handlers', () => {
      render(<MatrixGrid {...defaultProps} />);

      expect(screen.queryByText('Bulk Mode')).not.toBeInTheDocument();
    });
  });
});
