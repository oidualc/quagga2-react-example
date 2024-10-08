# quagga2-react-example

Showcasing Quagga2 in combination with ReactJS TypeScript v18+.

## Usage with Docker

Run

```
docker build -t quagga2-react-example:1 .
```

then

```
docker run -p 80:80 quagga2-react-example:1
```

and open `http://localhost/` in your browser.

## Usage with local installation

### Requirements

- NodeJS v18+
- pnpm v7+

Install dependencies with pnpm:

```
pnpm install
```

Start the dev server with:

```
pnpm dev
```

then open `http://localhost:5173/` in your browser. When a code is detected it will appear on the screen.

To configure the decoders types edit [src/features/scanner/config.ts](src/features/scanner/config.ts).  
You can find the available decoders on [https://github.com/ericblade/quagga2#decoder](https://github.com/ericblade/quagga2#decoder).
