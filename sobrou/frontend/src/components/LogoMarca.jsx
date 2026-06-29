export default function LogoMarca({ tamanho = 'medio' }) {
  const classes = {
    pequeno: { icone: 34, fonteIcone: '1rem', fonteNome: '1.15rem' },
    medio: { icone: 56, fonteIcone: '1.6rem', fonteNome: '1.8rem' },
    grande: { icone: 84, fonteIcone: '2.4rem', fonteNome: '2.4rem' },
  }[tamanho];

  return (
    <div style={{ display: 'flex', flexDirection: tamanho === 'pequeno' ? 'row' : 'column', alignItems: 'center', gap: tamanho === 'pequeno' ? 10 : 14 }}>
      <div
        style={{
          width: classes.icone,
          height: classes.icone,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: tamanho === 'pequeno' ? 10 : 18,
          background: 'linear-gradient(145deg, var(--vermelho-vibrante), var(--vermelho-escuro))',
          fontFamily: 'var(--fonte-display)',
          fontWeight: 800,
          fontSize: classes.fonteIcone,
          color: '#fff',
          boxShadow: '0 8px 24px var(--vermelho-glow)',
          flexShrink: 0,
        }}
      >
        S
      </div>
      <span style={{ fontFamily: 'var(--fonte-display)', fontWeight: 800, fontSize: classes.fonteNome }}>
        Sobrou
      </span>
    </div>
  );
}
