# hooks/

Hooks customizados que encapsulam lógica reutilizável com estado (ex.:
`useAuth()`, `useConversation()`). Criar um hook só compensa quando a mesma
lógica é usada em mais de um lugar — evite criar hooks "por padrão" para lógica
usada uma única vez.
