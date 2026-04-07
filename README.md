# Font Embedder

This is a temporary repository for experimenting with
[@cantoo-scribe/pdf-lib](https://github.com/cantoo-scribe/pdf-lib).
Its aim is to find out, how to embed the 14 standard PDF fonts into a PDF
document.

See https://github.com/cantoo-scribe/pdf-lib/issues/98

## Description

### Actual Test Program

Run the test program:

```sh
# pnpx tsx ./src/index.ts
pnpm run start
```

This writes a file `./embedded.pdf`, unfortunately broken.

### Generate Test PDFs

The PDFs in `assets/pdf` are generated with the two scripts
`src/generate-arial.ts` and `src/generate-standard-fonts.ts.

