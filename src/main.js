import { $ } from './utils.js';
import { loadSave } from './save.js';
import { initAudio } from './audio.js';
import { paintTitle } from './render/paint.js';
import { goto } from './ui/screens.js';
import { buildMenu } from './ui/menu.js';
import { buildChars } from './ui/chars.js';
import { fitCanvas, setBattleHooks } from './battle/engine.js';

setBattleHooks({
  onReturnMenu: () => {
    goto('#scr-menu');
    buildMenu();
  },
});

$('#btn-start').onclick = () => {
  initAudio();
  goto('#scr-menu');
  buildMenu();
};
$('#btn-chars').onclick = () => {
  goto('#scr-chars');
  buildChars();
};
$('#btn-chars-back').onclick = () => {
  goto('#scr-menu');
  buildMenu();
};
$('#btn-help').onclick = () => $('#ov-help').classList.add('show');
$('#btn-help-close').onclick = () => $('#ov-help').classList.remove('show');

addEventListener('resize', () => {
  fitCanvas();
  paintTitle();
});

loadSave();
fitCanvas();
paintTitle();
