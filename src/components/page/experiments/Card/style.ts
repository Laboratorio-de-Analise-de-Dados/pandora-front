import styled from 'styled-components';

export const ExperimentComponent = styled.li`
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* Alinha o conteúdo interno ao topo */
  align-items: flex-start; /* Alinha o conteúdo interno à esquerda (ou início do flex-direction) */

  width: 10rem;
  min-height: 8rem; /* Adiciona uma altura mínima para evitar colapsar se o conteúdo for pequeno */
  max-width: 100%; /* Garante que não ultrapasse o contêiner em telas pequenas */

  padding: 1rem;
  border-radius: 15px;

  /* Usando a cor do tema, como discutimos anteriormente */
  border: 0.2rem solid ${(props) => props.theme.palette.primary.main};
  background-color: ${(props) => props.theme.palette.background.paper}; /* Cor de fundo para o card */
  color: ${(props) => props.theme.palette.text.primary}; /* Cor do texto padrão do card */

  /* Para garantir que o card se comporte como um bloco e não seja afetado por "texto acima" */
  box-sizing: border-box; /* Garante que padding e border sejam incluídos no width/height */
  
  /* Adiciona alguma margem para separar os cards uns dos outros, se estiverem em uma lista */
  margin: 0.5rem; 

  /* Efeitos visuais para interação (opcional) */
  cursor: pointer;
  transition: all 0.2s ease-in-out; /* Transição suave para hover */

  &:hover {
    transform: translateY(-3px); /* Leve levantamento ao passar o mouse */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Sombra suave */
  }

  /* Estilos para o título dentro do card */
  h1 {
    font-size: 1.2rem; /* Tamanho da fonte ajustado para o card */
    margin-top: 0; /* Remove margem superior padrão do h1 */
    margin-bottom: 0.5rem; /* Margem inferior para separar do próximo item */
    white-space: nowrap; /* Evita quebras de linha no título */
    overflow: hidden; /* Esconde o texto que transborda */
    text-overflow: ellipsis; /* Adiciona "..." se o texto for muito longo */
    width: 100%; /* Garante que o h1 ocupe a largura do card */
  }

  /* Estilos para o div de tipo dentro do card */
  div {
    font-size: 0.9rem;
    color: ${(props) => props.theme.palette.text.secondary}; /* Cor mais suave para o tipo */
  }
`;