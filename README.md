# Autograph

Autograph is a generative art application that creates "pookalams" using mathematical equations and fractal patterns.

![Screenshot of the Autograph application](public/sprite.png)

## How It Works

The application is built with React and uses the HTML5 Canvas for rendering the pookalam designs. The core of the application lies in the generative algorithms that produce the floral patterns. These algorithms are based on mathematical concepts like fractals, trigonometric functions, and polar coordinates.

Users can interact with the application through a set of controls that allow them to modify the parameters of the generative algorithms. These parameters include:

- **Style (Seed)**: A seed for the random number generator to create different base patterns.
- **Speed**: The drawing speed of the animation.
- **Resolution**: The level of detail in the generated pattern.
- **Density**: The number of layers in the pookalam.
- **Petals**: The number of primary petals in the design.
- **Size**: The overall size of the pookalam.
- **Complexity**: The intricacy of the fractal details.
- **Symmetry**: The degree of symmetry in the pattern.

By adjusting these parameters, users can create a wide variety of unique and beautiful pookalam designs. The application also includes several presets to showcase different styles of pookalams.

## Running the Project

To run the project locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/alpha-og/autograph.git
    cd autograph
    ```

2.  **Install dependencies:**
    This project uses `pnpm` as the package manager.

    ```bash
    pnpm install
    ```

3.  **Start the development server:**
    ```bash
    pnpm dev
    ```
    This will start the Vite development server and open the application in your default browser at `http://localhost:5173`.

## Available Scripts

- `pnpm dev`: Runs the app in development mode.
- `pnpm build`: Builds the app for production.
- `pnpm preview`: Serves the production build locally for preview.
- `pnpm lint`: Lints the codebase using ESLint.

