# 📼 Locadora Retrô 90s - Super Nintendo & Games

Uma aplicação web imersiva e nostálgica que recria a experiência de uma **locadora de videogame brasileira dos anos 90**, com estante interativa de fitas de Super Nintendo, TV de tubo CRT com efeitos de scanlines e emulação WebAssembly (WASM) nativa para **PC e Mobile**!

---

## 🕹️ Funcionalidades

- **Estante Interativa 3D**:
  - Prateleiras com cartuchos de SNES alinhados, ranhuras de ventilação, etiquetas de locadora numeradas e arte de capa.
  - Efeitos sonoros mecânicos sintetizados ao selecionar as fitas.
- **TV de Tubo CRT (Philco-Hitachi Lumina 20")**:
  - Efeito fosforescente de canal `AV - CH 03`.
  - Filtro CRT com linhas de varredura (*scanlines*) e curvatura de tubo opcionais.
  - Modo Tela Cheia (*Fullscreen*).
- **Emulação WebAssembly Integrada**:
  - Execução cliente-side instantânea via **EmulatorJS** (core Snes9x).
  - Sem necessidade de instalar emuladores externos no PC ou apps no celular.
  - Suporte a salvar o jogo na memória do navegador (*Save States* e bateria interna do cartucho).
- **Totalmente Responsivo (PC & Mobile)**:
  - **No PC**: controles no teclado e suporte nativo a gamepads USB/Bluetooth (Xbox, PlayStation, etc.).
  - **No Celular**: controles virtuais translúcidos na tela (D-Pad e botões coloridos), ajustados para não sobrepor a imagem do jogo.
- **Carregador de ROMs Externas**:
  - Botão na barra superior que permite arrastar ou carregar qualquer arquivo `.sfc`, `.smc` ou `.zip` do seu dispositivo para jogar na hora.

---

## 🎮 Catálogo de Jogos em Português (PT-BR)

A locadora já vem com 7 dos maiores clássicos do Super Nintendo 100% traduzidos:

1. 🛡️ **The Legend of Zelda: A Link to the Past** — *Um Elo com o Passado* (Ação / Aventura)
2. 🍄 **Super Mario World** — *Super Mario Bros. 4* (Plataforma 2D)
3. 🍌 **Donkey Kong Country** — *Aventura na Ilha Kong* (Plataforma 2D)
4. 🏎️ **Top Gear** — *Velocidade Máxima* (Corrida / Arcade)
5. ⏳ **Chrono Trigger** — *A Jornada Através do Tempo* (JRPG)
6. 🤖 **Mega Man X** — *Guerra dos Mavericks* (Ação / Plataforma)
7. 🌌 **Super Metroid** — *Metroid 3* (Metroidvania / Ação)

---

## 🚀 Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org) (v18 ou superior).

### Instalação e Execução
```bash
# Clone o repositório
git clone https://github.com/hchinaglia/locadora_retro.git
cd locadora_retro

# Inicie o servidor local
npm start
```

### Acessar
- **No Computador (PC)**: Abra [http://localhost:3000](http://localhost:3000)
- **No Celular (Mobile)**: Conecte o celular na mesma rede Wi-Fi e acesse `http://<SEU_IP_LOCAL>:3000`

---

## ⌨️ Controles

### No Computador (Teclado)
| Ação | Tecla |
| :--- | :--- |
| **Movimento (D-Pad)** | Setas do Teclado |
| **Botão B** | `Z` |
| **Botão A** | `X` |
| **Botão Y** | `A` |
| **Botão X** | `S` |
| **L / R** | `Q` / `W` |
| **Start / Select** | `Enter` / `Shift` |

*Também suporta controles USB e Bluetooth automaticamente.*

### No Celular (Smartphone)
- Controles virtuais na tela surgem automaticamente (D-Pad direcional e botões SNES).
- Recomenda-se jogar no **modo paisagem (celular na horizontal)** para uma experiência estilo console portátil!

---

## 📜 Licença
Distribuído sob a licença MIT. Criado por Henrique Chinaglia.
