import styled, { css } from "styled-components"

export const ExperimentComponent = styled.li<{ $inactive?: boolean }>`
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;

	flex: 1 1 15rem;
	max-width: 24rem;
	min-height: 8rem;

	padding: 1rem;
	border-radius: 16px;

	/* FE-26: separação por elevação + borda discreta; verde só no hover */
	border: 1px solid ${(props) => props.theme.palette.divider};
	background-color: ${(props) => props.theme.palette.background.paper};
	color: ${(props) => props.theme.palette.text.primary};

	box-sizing: border-box;
	overflow: hidden;

	cursor: pointer;
	transition:
		border-color 180ms ease,
		box-shadow 180ms ease,
		transform 180ms ease;

	&:hover {
		transform: translateY(-2px);
		border-color: ${(props) => props.theme.palette.primary.main};
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
	}

	canvas {
		transition: transform 300ms ease;
	}

	&:hover canvas {
		transform: scale(1.05);
	}

	${(props) =>
		props.$inactive &&
		css`
			border-color: ${props.theme.palette.text.disabled};
			border-style: dashed;
			background-color: ${props.theme.palette.action.disabledBackground};
			color: ${props.theme.palette.text.disabled};
			filter: grayscale(0.8);
			opacity: 0.65;

			h1,
			div {
				color: ${props.theme.palette.text.disabled};
			}
		`}

	h1 {
		font-size: 1.05rem;
		font-weight: 600;
		margin-top: 0;
		margin-bottom: 0.35rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
	}

	div {
		font-size: 0.9rem;
		color: ${(props) => props.theme.palette.text.secondary};
	}

	.meta {
		font-size: 0.8rem;
	}

	.status-row {
		margin: 0 0 0.35rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.inactive-badge {
		margin-top: 0.5rem;
		font-size: 0.75rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.card-footer {
		margin-top: auto;
		padding-top: 0.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		font-size: 0.7rem;

		.creator,
		.org {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.org {
			text-align: right;
		}
	}
`
