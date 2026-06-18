package za.co.univen.research_output.config;

/**
 * Deprecated legacy filter retained only to avoid breaking references.
 *
 * Global CORS is handled in {@link CorsConfig}; this class is intentionally not a servlet filter bean.
 */
@Deprecated
public final class CorsResponseFilter {

    private CorsResponseFilter() {
        // Utility holder; no instances.
    }
}
