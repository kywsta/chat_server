import { ConditionalFilter, FilterOperator } from "../../domain/repositories";

export class FilterUtil {
  /**
   * Applies a conditional filter to an entity
   * @param entity The entity to test against
   * @param filter The conditional filter to apply
   * @returns True if the entity matches the filter condition
   */
  static applyConditionalFilter<T>(
    entity: T,
    filter: ConditionalFilter
  ): boolean {
    const entityValue = (entity as any)[filter.key];

    switch (filter.operator) {
      case FilterOperator.EQUALS:
        return entityValue === filter.value;

      case FilterOperator.NOT_EQUALS:
        return entityValue !== filter.value;

      case FilterOperator.GREATER_THAN:
        return entityValue > filter.value;

      case FilterOperator.GREATER_THAN_OR_EQUAL:
        return entityValue >= filter.value;

      case FilterOperator.LESS_THAN:
        return entityValue < filter.value;

      case FilterOperator.LESS_THAN_OR_EQUAL:
        return entityValue <= filter.value;

      case FilterOperator.IN:
        return (
          Array.isArray(filter.value) && filter.value.includes(entityValue)
        );

      case FilterOperator.NOT_IN:
        return (
          Array.isArray(filter.value) && !filter.value.includes(entityValue)
        );

      case FilterOperator.LIKE:
        return this.likeComparison(entityValue, filter.value);

      case FilterOperator.NOT_LIKE:
        return !this.likeComparison(entityValue, filter.value);

      case FilterOperator.CONTAINS:
        return this.containsComparison(entityValue, filter.value);

      case FilterOperator.STARTS_WITH:
        return this.startsWithComparison(entityValue, filter.value);

      case FilterOperator.ENDS_WITH:
        return this.endsWithComparison(entityValue, filter.value);

      case FilterOperator.IS_NULL:
        return entityValue === null || entityValue === undefined;

      case FilterOperator.IS_NOT_NULL:
        return entityValue !== null && entityValue !== undefined;

      default:
        throw new Error(`Unsupported filter operator: ${filter.operator}`);
    }
  }

  /**
   * Applies all conditional filters to an entity
   * @param entity The entity to test against
   * @param filters Array of conditional filters to apply
   * @returns True if the entity matches all filter conditions
   */
  static applyAllConditionalFilters<T>(
    entity: T,
    filters: ConditionalFilter[]
  ): boolean {
    return filters.every((filter) =>
      this.applyConditionalFilter(entity, filter)
    );
  }

  /**
   * SQL LIKE comparison for strings
   * Supports % as wildcard for multiple characters and _ for single character
   */
  private static likeComparison(entityValue: any, pattern: string): boolean {
    if (typeof entityValue !== "string") {
      return false;
    }

    // Convert SQL LIKE pattern to regex
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special regex chars
      .replace(/%/g, ".*") // % becomes .*
      .replace(/_/g, "."); // _ becomes .

    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(entityValue);
  }

  /**
   * Case-insensitive contains comparison for strings and array membership check
   */
  private static containsComparison(
    entityValue: any,
    searchValue: any
  ): boolean {
    // Handle array membership check
    if (Array.isArray(entityValue)) {
      return entityValue.includes(searchValue);
    }

    // Handle string contains check
    if (typeof entityValue === "string" && typeof searchValue === "string") {
      return entityValue.toLowerCase().includes(searchValue.toLowerCase());
    }

    return false;
  }

  /**
   * Case-insensitive starts with comparison
   */
  private static startsWithComparison(
    entityValue: any,
    searchValue: string
  ): boolean {
    if (typeof entityValue !== "string") {
      return false;
    }
    return entityValue.toLowerCase().startsWith(searchValue.toLowerCase());
  }

  /**
   * Case-insensitive ends with comparison
   */
  private static endsWithComparison(
    entityValue: any,
    searchValue: string
  ): boolean {
    if (typeof entityValue !== "string") {
      return false;
    }
    return entityValue.toLowerCase().endsWith(searchValue.toLowerCase());
  }
}
