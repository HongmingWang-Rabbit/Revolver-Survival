# 🎰 Game Proposal: Revolver Survival (Stake Engine Format)

**Goal:** To propose the game mechanics and structure for "Revolver Survival," adapted to meet the **static file and simulation requirements** of the Stake Engine framework.

---

### 1. Game Title and Concept

| Attribute         | Details                                                                                                                                                                               |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Title**         | Revolver Survival                                                                                                                                                                     |
| **Concept**       | A high-stakes betting game inspired by Russian Roulette, where players bet on surviving a round fired from a six-chamber revolver loaded with a chosen number of bullets.             |
| **Core Mechanic** | Probability of survival based on the ratio of empty chambers to total chambers (6). The outcome is pre-determined via the **Stake Engine simulation file** upon initiating the round. |

---

### 2. Core Game Parameters (Constants)

| Parameter      | Value          | Description                                                         |
| :------------- | :------------- | :------------------------------------------------------------------ |
| `CHAMBERS`     | 6              | The total number of chambers in the revolver cylinder.              |
| `HOUSE_EDGE`   | 0.0233 (2.33%) | The commission taken by the house (baked into the odds multiplier). |
| `BULLET_RANGE` | 1 to 5         | The user-selectable number of live bullets loaded.                  |

---

### 3. Odds and Payout Calculation

The payout multiplier and survival chance are calculated based on the chosen number of bullets:

- **Empty Chambers:** $E = \text{CHAMBERS} - \text{bullets}$
- **Actual Payout Multiplier:** $\text{Multiplier} = \left(\frac{\text{CHAMBERS}}{E}\right) \times (1 - \text{HOUSE\_EDGE})$

| Bullets Loaded | Empty Chambers | Survival Rate (Theoretical Probability) | Approx. Multiplier (x) |
| :------------: | :------------: | :-------------------------------------: | :--------------------: |
|       1        |       5        |                 83.33%                  |         x1.17          |
|       2        |       4        |                 66.67%                  |         x1.46          |
|       3        |       3        |                 50.00%                  |         x1.95          |
|       4        |       2        |                 33.33%                  |         x2.93          |
|       5        |       1        |                 16.67%                  |         x5.85          |

---

### 4. Stake Engine Integration Requirements

This game requires **5 separate simulation files** (one for each bullet count mode: 1 to 5 bullets) to adhere to the Stake Engine's requirement that all possible game outcomes be pre-calculated and contained in static files.

#### 4.1. Simulation File Structure (Example: 1 Bullet Mode)

The math engine (Python-based) must generate a file structure that maps every possible outcome to a multiplier. Since this game is purely probabilistic (win/loss only), the simulation file for each mode only needs two entries representing the total outcome distribution.

| Column                       | Description                                                                  |
| :--------------------------- | :--------------------------------------------------------------------------- |
| **Simulation Number (ID)**   | A unique integer ID for the outcome (e.g., 1, 2).                            |
| **Probability of Selection** | The exact fractional probability of this outcome occurring (e.g., 5/6, 1/6). |
| **Final Payout Multiplier**  | The resulting multiplier applied to the Pot (e.g., x1.17 or x0.00).          |
| **Event Summary**            | A JSON or text summary of the round for the `/play` API response.            |

|   Sim. ID    | Probability (Weighting) |            Final Multiplier            | Event Summary                                                             |
| :----------: | :---------------------: | :------------------------------------: | :------------------------------------------------------------------------ |
| **1 (Win)**  | $(6-\text{bullets})/6$  | $\text{Multiplier}$ (from table above) | `{"outcome": "Survived", "new_bullets": bullets, "spin_result": "Empty"}` |
| **2 (Loss)** |   $\text{bullets}/6$    |                 $0.00$                 | `{"outcome": "Death", "new_bullets": bullets, "spin_result": "Live"}`     |

#### 4.2. Game Modes and Static Files

|    Mode    | Bullet Count | Probability of Selection (for Win) | Required Multiplier |  Static File Name  |
| :--------: | :----------: | :--------------------------------: | :-----------------: | :----------------: |
| **Mode 1** |      1       |                5/6                 |        x1.17        | `sim_1_bullet.csv` |
| **Mode 2** |      2       |                4/6                 |        x1.46        | `sim_2_bullet.csv` |
| **Mode 3** |      3       |                3/6                 |        x1.95        | `sim_3_bullet.csv` |
| **Mode 4** |      4       |                2/6                 |        x2.93        | `sim_4_bullet.csv` |
| **Mode 5** |      5       |                1/6                 |        x5.85        | `sim_5_bullet.csv` |

---

### 5. Game Flow and API Actions

The client (Front End Framework) will interact with the Stake RGS via the Wallet and Play Endpoints.

| Step                        | Action/Function                                      | Details (Stake Engine Compliant)                                                                                                                                                                                                                              |
| :-------------------------- | :--------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Initial Bet**          | **Client:** Collects `bet` and `bullets` mode (1-5). | The `bullets` selection determines which pre-calculated static file the RGS will use.                                                                                                                                                                         |
|                             | **RGS Play API Call**                                | The client initiates a `/play` request specifying the chosen mode (e.g., `mode=1_bullet`) and the `bet` amount.                                                                                                                                               |
| **2. Result Determination** | **RGS Server Side**                                  | Instead of rolling a random number on the client, the RGS selects a **Simulation Number** from the corresponding static file (`sim_X_bullet.csv`) based on its proportional weighting (probability).                                                          |
| **3. Outcome Delivery**     | **RGS Play API Response**                            | The RGS returns the results via the `/play` API response, including the final multiplier (`0.00` or $\text{Multiplier}$), the Win/Loss event summary, and the updated wallet balance.                                                                         |
| **4. Client Handling**      | `handleSurvival()` or `handleDeath()`                | The client uses the multiplier/event summary from the RGS response to trigger the correct animations and UI updates (e.g., playing `SFX.playBang` and setting `pose-dead` if the multiplier is `0.00`).                                                       |
| **5. Cash Out/Continue**    | **Client/RGS Interaction**                           | If the player survives, the client presents two options: **Cash Out** (triggers a withdrawal/settlement call) or **Continue Firing** (triggers a new `/play` call using the existing **Pot** amount as the new _risk_ amount, but with the same bullet mode). |
