import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FluidCard } from './FluidCard';

describe('FluidCard', () => {
  it('renders children correctly', () => {
    render(<FluidCard>Hello World</FluidCard>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders gradient with var() when using a CSS variable as headerColor', () => {
    const { container } = render(<FluidCard headerColor="--primary-color">Content</FluidCard>);
    const gradientOverlay = container.querySelector('.fluid-card > div:first-of-type');
    expect(gradientOverlay?.getAttribute('style')).toContain('background: linear-gradient(135deg, var(--primary-color) 0%, transparent 60%)');
  });

  it('renders gradient directly when using hex or rgba as headerColor', () => {
    const { container } = render(<FluidCard headerColor="#ff0000">Content</FluidCard>);
    const gradientOverlay = container.querySelector('.fluid-card > div:first-of-type');
    // jsdom might normalize #ff0000 to rgb(255, 0, 0) in the style attribute
    const styleAttr = gradientOverlay?.getAttribute('style') || '';
    const hasGradient = styleAttr.includes('#ff0000') || styleAttr.includes('rgb(255, 0, 0)');
    expect(hasGradient).toBe(true);
    expect(styleAttr).toContain('linear-gradient(135deg');
  });

  it('renders action icon if provided and handles click', () => {
    const handleActionClick = vi.fn();
    render(
      <FluidCard actionIcon={<span data-testid="icon">Icon</span>} onActionClick={handleActionClick}>
        Content
      </FluidCard>
    );

    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();

    const iconWrapper = icon.parentElement;
    if (iconWrapper) {
      fireEvent.click(iconWrapper);
    }
    expect(handleActionClick).toHaveBeenCalledTimes(1);
  });

  it('handles card click when onClick is provided', () => {
    const handleClick = vi.fn();
    const { container } = render(<FluidCard onClick={handleClick}>Content</FluidCard>);

    // The main container is the motion.div which is the first child of the render root
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('cursor-pointer');

    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not have cursor-pointer class if onClick is not provided', () => {
    const { container } = render(<FluidCard>Content</FluidCard>);

    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass('cursor-pointer');
  });

  it('applies custom styles from style prop', () => {
    const { container } = render(<FluidCard style={{ margin: '10px' }}>Content</FluidCard>);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveStyle('margin: 10px');
  });

  it('applies custom inner styles from innerStyle prop', () => {
    const { container } = render(<FluidCard innerStyle={{ backgroundColor: 'red' }}>Content</FluidCard>);

    // The children wrapper is the last div
    const childrenWrapper = container.querySelector('.fluid-card > div:last-of-type') as HTMLElement;
    expect(childrenWrapper?.getAttribute('style')).toContain('background-color: red');
  });
});
