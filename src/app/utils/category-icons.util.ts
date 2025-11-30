import { Category } from '../models/category.model';

/**
 * Maps category names to default icons/emojis
 * This provides fallback icons when categories don't have custom icons
 */
export class CategoryIconUtil {
  private static defaultIcons: { [key: string]: string } = {
    'Oil': '🛢️',
    'Current Bill': '⚡',
    'Rice': '🍚',
    'Food': '🍽️',
    'Transport': '🚗',
    'Shopping': '🛒',
    'Bills': '📄',
    'Entertainment': '🎬',
    'Health': '🏥',
    'Education': '📚',
    'Travel': '✈️',
    'Personal': '👤',
    'Work': '💼',
    'Events': '🎉',
    'Utilities': '🔌',
    'Groceries': '🛒',
    'Restaurant': '🍴',
    'Gas': '⛽',
    'Internet': '🌐',
    'Phone': '📱',
    'Rent': '🏠',
    'Insurance': '🛡️',
    'Medical': '💊',
    'Clothing': '👕',
    'Gifts': '🎁',
    'Other': '📦'
  };

  /**
   * Get icon for a category
   * Priority: category.iconUrl > category.icon > default icon based on name
   */
  static getCategoryIcon(category: Category | null | undefined): string {
    if (!category) return '📋';

    // If category has iconUrl, return it (for image display)
    if (category.iconUrl) {
      return category.iconUrl;
    }

    // If category has icon (emoji), return it
    if (category.icon) {
      return category.icon;
    }

    // Fallback to default icon based on category name
    const categoryName = category.name || '';
    const defaultIcon = this.defaultIcons[categoryName] || this.defaultIcons[categoryName.toLowerCase()] || '📋';
    return defaultIcon;
  }

  /**
   * Check if the icon is an emoji (simple check)
   */
  static isEmoji(icon: string): boolean {
    // Simple check: if it's a URL, it's not an emoji
    return !icon.startsWith('http') && !icon.startsWith('/') && !icon.includes('.');
  }

  /**
   * Get all default icons mapping
   */
  static getDefaultIcons(): { [key: string]: string } {
    return { ...this.defaultIcons };
  }
}

