export interface IDispatcherEvent {
	id: string,
	type: string,
	namespace?: string,
	userId?: string | number,
	sessionId?: string,
	timestamp?: string,
	time?: number,
	agent?: string,
	processed?: boolean,
	properties: Record<string, any>
}
