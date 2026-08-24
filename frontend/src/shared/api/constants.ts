// В production запросы по умолчанию идут в nginx на том же домене.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
