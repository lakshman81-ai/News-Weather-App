# News Rating & Audit System Architecture

This document visualizes the data flow for the News Rating, Section Health, and Audit System.

## Architecture Flowchart

```mermaid
flowchart TD
    %% --- External Sources ---
    RSS[RSS Feeds] -->|Raw XML| Fetcher[RSS Aggregator]

    %% --- Fetch & Normalize ---
    Fetcher -->|Parse| Normalize[Normalize Item]
    Normalize -->|Extract| Metadata[Title, Source, Date, Image]
    Normalize -->|Classify| Section[Section Classifier]

    %% --- Section Health Monitoring (Synchronous) ---
    subgraph "Section Health Monitor"
        Section --> Count{Count Items}
        Count -->|Record| History[LocalStorage History]
        History -->|Avg(3)| CalcHealth[Calculate Ratio]
        CalcHealth -->|Ratio < 0.5| Warn[⚠️ Warning]
        CalcHealth -->|Ratio < 0.1| Crit[🔴 Critical]
        CalcHealth -->|Ratio >= 0.5| OK[🟢 OK]
        Warn --> UI_Header[Section Header Badge]
        Crit --> UI_Header
    end

    %% --- Pre-Processing ---
    Section --> Filter[Filter & Rank]
    Filter -->|1. Freshness| FreshnessCheck{Age < Limit?}
    Filter -->|2. Keyword/Source| FilterMode{Check Settings}

    %% --- Scoring System ---
    subgraph "Scoring Engine"
        FilterMode --> BaseScore[Base Score]
        BaseScore -->|Source Credibility| Stars[⭐ Credibility]
        BaseScore -->|Impact Keywords| Impact[Impact Score]
        BaseScore -->|Sentiment| Senti[Sentiment Analysis]
        BaseScore -->|Visuals| Vis[Visual Score]
        BaseScore -->|Proximity| Prox[Local Boost]

        Stars & Impact & Senti & Vis & Prox --> TotalScore[Final ImpactScore]
    end

    %% --- Clustering (Consensus) ---
    TotalScore --> Cluster[Deduplicate & Cluster]
    Cluster -->|Similiarity > 0.75| Group[Group Articles]
    Group -->|Count Unique Sources| SourceCount[Source Count]
    SourceCount -->|Apply Boost| BoostedScore[Boosted ImpactScore]

    %% --- Data State Update ---
    BoostedScore --> Context[NewsContext State]
    Context --> UI_List[Render News List]

    %% --- Audit Loop (Asynchronous / Idle Time) ---
    subgraph "Audit System (Post-Processing)"
        Context -->|Wait 3s| Audit[Run Full Audit]

        %% 1. Consensus
        Audit -->|Check SourceCount > 1| Lightning{Consensus?}
        Lightning -->|Yes| BadgeBolt[⚡ Badge]

        %% 2. Persistence
        Audit -->|Check Previous Top 10| Persist{In History?}
        Persist -->|Yes| BadgeCloud[🌩️ Badge]

        %% 3. Relevance
        Audit -->|Check User Keywords| Relevance{Match?}
        Relevance -->|Keyword + Source| BadgeTarget[🎯 Badge]
        Relevance -->|Keyword Only| BadgePin[📌 Badge]

        %% 4. Anomalies
        Audit -->|Age > 2x Median| Old{Stale?}
        Old -->|Yes| BadgeClock[🕰️ Badge]

        Audit -->|Score Deviation| Outlier{Sigma > 2?}
        Outlier -->|High| BadgeUp[📊↑ Badge]
        Outlier -->|Low| BadgeDown[📊↓ Badge]
    end

    %% --- Visual Updates ---
    BadgeBolt & BadgeCloud & BadgeTarget & BadgePin & BadgeClock & BadgeUp --> UI_Badges[Update Article Badges]
    UI_Badges -.-> UI_List
```

## Logic Breakdown

### 1. Section Health (Synchronous)
*   **Trigger**: Immediately after fetching a section.
*   **Logic**: `Ratio = CurrentCount / Avg(Last 3 Fetches)`
*   **Output**: `newsData.health` object attached to the array.

### 2. Scoring & Ranking (Synchronous)
*   **Trigger**: During `fetchSectionNews`.
*   **Factors**: Freshness, Source Tier, Keywords, Sentiment, Breaking Status.
*   **Output**: `impactScore` used for sorting.

### 3. Consensus (Clustering)
*   **Trigger**: `deduplicateAndCluster` utility.
*   **Logic**: stringSimilarity > 0.75.
*   **Output**: `item.sourceCount`. If > 1, it boosts the score but doesn't show badge *yet*.

### 4. Audit System (Asynchronous)
*   **Trigger**: 3 seconds after `NewsContext` updates.
*   **Reason**: To avoid blocking the main thread during initial render.
*   **Logic**:
    *   **Consensus**: Checks `item.sourceCount` (calculated in step 3).
    *   **Persistence**: Compares ID against `localStorage` history of previous fetch.
    *   **Relevance**: Regex match against user settings.
*   **Output**: `auditResults` state in Context, which re-renders specific badges.
