import fs from 'fs';
import path from 'path';

const pluginDir = 'plugins';
const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));

const replacements = [
  { match: /intenta mas tarde|intente mas tarde/gi, replace: 'tente de novo mais tarde' },
  { match: /Error al obtener información/gi, replace: 'Erro ao obter informações' },
  { match: /Escribí algo/gi, replace: 'Escreva algo' },
  { match: /Falló la búsqueda/gi, replace: 'Busca falhou' },
  { match: /probá más tarde/gi, replace: 'tente mais tarde' },
  { match: /Se transmitió a todos/gi, replace: 'Transmitido para todos' },
  { match: /Comando guardado/gi, replace: 'Comando salvo' },
  { match: /Comando eliminado/gi, replace: 'Comando excluído' },
  { match: /Uso del comando/gi, replace: 'Uso do comando' },
  { match: /(✳️|❎|❌) Error/gi, replace: '$1 Erro' },
  { match: / Erro /gi, replace: ' Erro ' },
  { match: /Añadido/g, replace: 'Adicionado' },
  { match: /Añadidos/g, replace: 'Adicionados' },
  { match: /No tiene /g, replace: 'Não tem ' },
  { match: /Removido/g, replace: 'Removido' },
  { match: /No tienes suficientes /gi, replace: 'Você não tem suficientes ' },
  { match: /No tienes dinero para depositar/gi, replace: 'Você não tem dinheiro para depositar' },
  { match: /Se reinicio la economía/gi, replace: 'A economia foi reiniciada' },
  { match: /Lo sentimos/gi, replace: 'Desculpe' },
  { match: /Solo los administradores/gi, replace: 'Apenas administradores' },
  { match: /Solo el creador/gi, replace: 'Apenas o criador' },
  { match: /Solo el owner/gi, replace: 'Apenas o criador' },
  { match: /Solo administradores/gi, replace: 'Apenas administradores' },
  { match: /pueden usar este comando/gi, replace: 'podem usar este comando' },
  { match: /puede usar este comando/gi, replace: 'pode usar este comando' },
  { match: /es solo para administradores/gi, replace: 'é apenas para administradores' },
  { match: /Has depositado/gi, replace: 'Você depositou' },
  { match: /Has cometido un crimen exitosamente/gi, replace: 'Crime cometido com sucesso' },
  { match: /Tu crimen ha fallado/gi, replace: 'Seu crime falhou' },
  { match: /Los usuarios tienen sus monedas en el banco/gi, replace: 'Os usuários têm suas moedas no banco' },
  { match: /intenta robar más tarde/gi, replace: 'tente roubar mais tarde' },
  { match: /responder a /gi, replace: 'responder a ' },
  { match: /Enviando el /gi, replace: 'Enviando o ' },
  { match: /No estás registrado/gi, replace: 'Você não está registrado' },
  { match: /Para registrarte/gi, replace: 'Para se registrar' },
  { match: /Tu nivel es muy bajo/gi, replace: 'Seu nível é muito baixo' },
  { match: /Para ganar/gi, replace: 'Para ganhar' },
  { match: /Se requiere /gi, replace: 'É necessário ' },
  { match: /escribe algo/gi, replace: 'escreva algo' },
  { match: /Escribe algo/gi, replace: 'Escreva algo' },
  { match: /Ocurrió un error/gi, replace: 'Ocorreu um erro' },
  { match: /Enlace copiado/gi, replace: 'Link copiado' },
  { match: /Descarga completada/gi, replace: 'Download concluído' },
  { match: /enviando archivo/gi, replace: 'enviando arquivo' },
  { match: /grupo no encontrado/gi, replace: 'grupo não encontrado' },
  { match: /este comando es solo/gi, replace: 'este comando é apenas' },
  { match: /No tienes diamantes/gi, replace: 'Você não tem diamantes' },
  { match: /Ingresa un /g, replace: 'Insira um ' },
  { match: /ingresa un /g, replace: 'insira um ' },
  { match: /comando no encontrado/gi, replace: 'comando não encontrado' },
  { match: /no está registrado/gi, replace: 'não está registrado' }
];

let total = 0;
files.forEach(file => {
  const p = path.join(pluginDir, file);
  let content = fs.readFileSync(p, 'utf8');
  let changed = false;
  replacements.forEach(r => {
    if (content.match(r.match)) {
      content = content.replace(r.match, r.replace);
      changed = true;
    }
  });
  if (changed) {
    fs.writeFileSync(p, content, 'utf8');
    total++;
  }
});

let handlerPath = 'handler.js';
if (fs.existsSync(handlerPath)) {
  let content = fs.readFileSync(handlerPath, 'utf8');
  let changed = false;
  replacements.forEach(r => {
    if (content.match(r.match)) {
      content = content.replace(r.match, r.replace);
      changed = true;
    }
  });
  if (changed) fs.writeFileSync(handlerPath, content, 'utf8');
}

console.log('Traduzidos adicionais ' + total + ' arquivos de resposta para português com sucesso!');
