#!/bin/bash
echo "Empacotando KreatorJS para Windows..."
npm run build-win
echo "Empacotamento concluído!"
echo "Arquivo gerado em: dist/"
ls -la dist/
