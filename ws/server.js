import {WebSocket, WebSocketServer} from 'ws';
import { wsArcjet } from '../src/arcjet.js';
function sendJson(socket,payload){
    for(const client of wss.clients){
        if(client.readyState!==WebSocket.OPEN) continue;
        client.send(JSON.stringify(payload));
    }

}

function broadcast(wss,payload){
    for(const client of wss.clients){
        if(client.readyState !== WebSocket.OPEN) return;
        client.send(JSON.stringify(payload));

    }
}
export function attachWebSocketServer(server){
    const wss=new WebSocketServer({
        server,
        path:'/ws',
        maxPayload:1024*1024*1024,

    })
    wss.on('connection', async(socket,req)=>{
        if(wsArcjet){
            try{
                const decision=await wsArcjet.protect(req);
                if(decision.isDenied()){
                    const code=decision.reason.isRateLimit()?1013:1008;
                    const reason=decision.reason.isRateLimit() ? 'Rate limit exceeded':'Access denied';
                    socket.close(code,reason)
                    return;
                }

            }
            catch(e){
                console.error('WS connection error',e);
                socket.close(1011,'SERVER SECURITY ERROR');
            }
        }
        socket.isAlive=true;
        socket.on('pong',()=>{socket.isAlive=true});
        sendJson(socket,{type:'Welcome'});
        socket.on('error',console.error);
    })
    const interval=setInterval(()=>{
        wss.clients.forEach((ws)=>{
            if(ws.isAlive===false) return ws.terminate();
            ws.isAlive=false;
            ws.ping();


        
    })},3000);
    wss.on('close',()=>clearInterval(interval));
    function broadcastMatchCreated(match){
        broadcast(wss,{type:'match_created',data:match});

    }
    return {broadcastMatchCreated}
}