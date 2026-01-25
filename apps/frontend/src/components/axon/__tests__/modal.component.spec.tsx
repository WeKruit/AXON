import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal, ConfirmModal } from '../modal.component';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      render(
        <Modal
          {...defaultProps}
          footer={<button>Footer Button</button>}
        />
      );

      expect(screen.getByText('Footer Button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-modal attribute', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title');
    });

    it('should have close button with aria-label', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close modal when Escape key is pressed', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close modal for other keys', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'a' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    it('should close modal when close button is clicked', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when backdrop is clicked', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      const backdrop = screen.getByRole('presentation');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close modal when clicking inside modal content', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      const modalContent = screen.getByText('Modal content');
      fireEvent.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Size Variants', () => {
    it('should apply sm size class', () => {
      render(<Modal {...defaultProps} size="sm" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-sm');
    });

    it('should apply md size class by default', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-md');
    });

    it('should apply lg size class', () => {
      render(<Modal {...defaultProps} size="lg" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-lg');
    });

    it('should apply xl size class', () => {
      render(<Modal {...defaultProps} size="xl" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-xl');
    });
  });
});

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with title and message', () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('should render default button text', () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render custom button text', () => {
      render(
        <ConfirmModal
          {...defaultProps}
          confirmText="Delete"
          cancelText="Keep"
        />
      );

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      const onConfirm = jest.fn();
      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', () => {
      const onClose = jest.fn();
      render(<ConfirmModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal on Escape key', () => {
      const onClose = jest.fn();
      render(<ConfirmModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('should disable buttons when isLoading is true', () => {
      render(<ConfirmModal {...defaultProps} isLoading={true} />);

      const confirmButton = screen.getByRole('button', { name: /loading/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should not call onConfirm when clicking confirm while loading', () => {
      const onConfirm = jest.fn();
      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} isLoading={true} />);

      const confirmButton = screen.getByRole('button', { name: /loading/i });
      fireEvent.click(confirmButton);

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('should apply danger variant styles', () => {
      render(<ConfirmModal {...defaultProps} variant="danger" />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-red-500');
    });

    it('should apply warning variant styles', () => {
      render(<ConfirmModal {...defaultProps} variant="warning" />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-yellow-500');
    });

    it('should apply info variant styles', () => {
      render(<ConfirmModal {...defaultProps} variant="info" />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-blue-500');
    });
  });
});
