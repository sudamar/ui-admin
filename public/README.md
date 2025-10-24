# Pasta Public - Assets Estáticos

Esta pasta contém todos os arquivos estáticos públicos da aplicação.

## 📁 Estrutura de Pastas

```
public/
├── images/              # Imagens gerais do site
│   ├── logo-fafih.png
│   ├── logo-fafih-horizontal.jpeg
│   └── logo-fafih-quadrado-sem-fundo.png
├── avatars/            # Avatars de usuários
│   ├── default.png    # Avatar padrão
│   └── [1-N].png      # Avatars numerados
├── icons/              # Ícones e favicons
│   └── favicon.ico
└── documents/          # PDFs e documentos
    └── exemplo.pdf

```

## 🎯 Como Usar

Todos os arquivos em `/public` são servidos na raiz do domínio:

- `/public/images/logo.png` → acessível via `/images/logo.png`
- `/public/avatars/1.png` → acessível via `/avatars/1.png`
- `/public/icons/favicon.ico` → acessível via `/favicon.ico`

## 💡 Exemplos de Uso

### Em componentes React:
```tsx
// Image tag
<img src="/images/logo-fafih.png" alt="Logo" />

// Next.js Image component
import Image from 'next/image'
<Image src="/images/logo-fafih.png" alt="Logo" width={200} height={100} />

// Avatar
<Avatar>
  <AvatarImage src="/avatars/1.png" />
</Avatar>
```

### Em CSS:
```css
.logo {
  background-image: url('/images/logo-fafih.png');
}
```

## 📝 Boas Práticas

1. **Organize por tipo**: Mantenha imagens, ícones, documentos em pastas separadas
2. **Nomes descritivos**: Use nomes claros como `logo-fafih.png` ao invés de `img1.png`
3. **Otimize imagens**: Comprima imagens antes de adicionar ao projeto
4. **Formatos modernos**: Prefira WebP para imagens, SVG para ícones
5. **Versionamento**: Para cache busting, use query strings `?v=1.0`

## ⚠️ Importante

- Não armazene informações sensíveis nesta pasta (tudo é público!)
- Evite arquivos muito grandes (use CDN para assets pesados)
- Prefira Next.js Image component para otimização automática
