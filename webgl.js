var teximg = [];
var texSrc = ["mushroom.png"];
var loadTexs = 0;
var prog;
var angle = 0;

function getGL(canvas) {
    var gl = canvas.getContext("webgl");
    if(gl) return gl;
    
    gl = canvas.getContext("experimental-webgl");
    if(gl) return gl;
    
    alert("Contexto WebGL inexistente! Troque de navegador!");
    return false;
}

function createShader(gl, shaderType, shaderSrc)
{
	var shader = gl.createShader(shaderType);
	gl.shaderSource(shader, shaderSrc);
	gl.compileShader(shader);
	
	if(gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		return shader;
	
	alert("Erro de compilaÃ§Ã£o: " + gl.getShaderInfoLog(shader));
	
	gl.deleteShader(shader);
}

function createProgram(gl, vtxShader, fragShader)
{
	var prog = gl.createProgram();
	gl.attachShader(prog, vtxShader);
	gl.attachShader(prog, fragShader);
	gl.linkProgram(prog);
	
	if(gl.getProgramParameter(prog, gl.LINK_STATUS))
		return prog;

    alert("Erro de linkagem: " + gl.getProgramInfoLog(prog));
	
	gl.deleteProgram(prog);	
}

function init() {
    for(i = 0; i < texSrc.length; i++) {
        teximg[i] = new Image();
        teximg[i].src = texSrc[i];
        teximg[i].onload = function()
        {
            loadTexs++;
    	    loadTextures();
        }
    }
}

function loadTextures()
{
    if(loadTexs == texSrc.length)
    {
       initGL();
       draw();
    }
}
    
function initGL() {

	var canvas = document.getElementById("glcanvas1");
	
	gl = getGL(canvas);
	if(gl)
	{
        //Inicializa shaders
 		var vtxShSrc = document.getElementById("vertex-shader").text;
		var fragShSrc = document.getElementById("frag-shader").text;

        var vtxShader = createShader(gl, gl.VERTEX_SHADER, vtxShSrc);
        var fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragShSrc);
        prog = createProgram(gl, vtxShader, fragShader);	
        
        gl.useProgram(prog);

        //Inicializa Ã¡rea de desenho: viewport e cor de limpeza; limpa a tela
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.enable( gl.BLEND );
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
        gl.enable(gl.DEPTH_TEST);
        //gl.enable(gl.CULL_FACE);

    }
}    

function rotateX(angle) {
    return math.matrix(
        [[1.0, 0.0, 0.0, 0.0],
         [0.0, Math.cos(angle*Math.PI/180.0), -Math.sin(angle*Math.PI/180.0), 0.0], 
         [0.0, Math.sin(angle*Math.PI/180.0),  Math.cos(angle*Math.PI/180.0), 0.0],
         [0.0,    0.0,   0.0 ,1.0]]
         );
}

function rotateY(angle) {
    return math.matrix(
        [[Math.cos(angle*Math.PI/180.0), 0.0, -Math.sin(angle*Math.PI/180.0), 0.0], 
         [0.0, 1.0, 0.0, 0.0],
         [Math.sin(angle*Math.PI/180.0),  0.0, Math.cos(angle*Math.PI/180.0), 0.0],
         [0.0,    0.0,   0.0, 1.0]]
         );
}

function rotateZ(angle) {
    return math.matrix(
        [[1.0, 0.0, 0.0, 0.0],
         [0.0, Math.cos(angle*Math.PI/180.0), -Math.sin(angle*Math.PI/180.0), 0.0], 
         [0.0, Math.sin(angle*Math.PI/180.0),  Math.cos(angle*Math.PI/180.0), 0.0],
         [0.0,    0.0,   0.0 ,1.0]]
         );
}

class AmbientLight {
    constructor(color) {
        this.color = color;

        //Pega ponteiro para o atributo "position" do vertex shader
        var ambientLight = gl.getUniformLocation(prog, "ambientLight");
        // var ambientLightColor = [0.2, 0.2, 0.2]; // Cor da luz ambiente
        gl.uniform4fv(ambientLight, this.color);
    }
}

class DiffuseLight {
    constructor(color, position) {
        this.color = color;
        this.position = position;

        var diffuseLight = gl.getUniformLocation(prog, "diffuseIlumination");
        gl.uniform4fv(diffuseLight, this.color);

        var diffusePos = gl.getUniformLocation(prog, "diffuseIluminationPos");
        gl.uniform4fv(diffusePos, this.position);
    }

    translating(x, y, z) {
        const transMatrix = translatingMatrix([x, y, z]);

        this.position = math.multiply(transMatrix, math.matrix([[this.position[0]], [this.position[1]], [this.position[2]], [1]]))._data;
        this.position = [this.position[0][0], this.position[1][0], this.position[2][0], 1];
        
        this.setUniformLocation();
    }

    rotate(axis, angle) {
        const rotMat = axis == 'X' ? rotateX(angle) : axis == 'Y' ? rotateY(angle) : rotateZ(angle);

        this.position = math.multiply(rotMat, math.matrix([[this.position[0]], [this.position[1]], [this.position[2]], [1]]))._data;
        this.position = [this.position[0][0], this.position[1][0], this.position[2][0], 1];    

        this.setUniformLocation();
    }

    setUniformLocation() {
        var diffuseLight = gl.getUniformLocation(prog, "diffuseIlumination");
        gl.uniform4fv(diffuseLight, this.color);

        var diffusePos = gl.getUniformLocation(prog, "diffuseIluminationPos");
        gl.uniform4fv(diffusePos, this.position);
    } 

    setPosition(x, y, z) {
        this.position = [x, y, z, 1];
        this.setUniformLocation();
    }
}

class Point {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Cube {
    calculateNormal(face) {
        //console.log(face)
        var auxVec = math.subtract(face[0], this.center);

        var u = math.subtract(face[1], face[0]);
        var v = math.subtract(face[2], face[0]);

        var cross = math.cross(u, v);

        var value = math.dot(cross, auxVec);

        if(value < 0) {
            cross[0] = -cross[0];
            cross[1] = -cross[1];
            cross[2] = -cross[2];
        }

        return math.divide(cross, math.norm(cross));
    }

    genNormals() {
        for(var i = 0; i < 6; i++) {
            var face1 = [[], [], []];

            // 18 porque tenho os bytes referente às cores
            face1[0] = [this.points[i*55+0], this.points[i*55+1], this.points[i*55+2]];
            face1[1] = [this.points[i*55+11], this.points[i*55+12], this.points[i*55+13]];
            face1[2] = [this.points[i*55+20], this.points[i*55+21], this.points[i*55+22]];

            var n1 = this.calculateNormal(face1);
            
            for(var j = 0; j < 5; j++) {
                this.points[i*55+j*11+6] = n1[0] == -0? 0 : n1[0];
                this.points[i*55+j*11+7] = n1[1] == -0? 0 : n1[1];
                this.points[i*55+j*11+8] = n1[2] == -0? 0 : n1[2];
            }
        }
    }

    genGeometry() {
        if(this.texture) {
            for(var i = 0; i < this.colors.length; i++) {
                this.colors[i] = [0, 0, 0]
            }
        }

        this.points = new Float32Array([
            // face da frente
            this.center[0]-this.half, this.center[1]+this.half, this.center[2]+this.half, ...this.colors[0],0,0,0,0,1,
            this.center[0]+this.half, this.center[1]+this.half, this.center[2]+this.half, ...this.colors[0],0,0,0,1,1,
            this.center[0]-this.half, this.center[1]-this.half, this.center[2]+this.half, ...this.colors[0],0,0,0,0,0,
            this.center[0]+this.half, this.center[1]-this.half, this.center[2]+this.half, ...this.colors[0],0,0,0,1,0,
            this.center[0]+this.half, this.center[1]+this.half, this.center[2]+this.half, ...this.colors[0],0,0,0,1,1,
            
            // face de trás
            this.center[0]-this.half, this.center[1]+this.half, this.center[2]-this.half, ...this.colors[1],0,0,0,0,1,
            this.center[0]+this.half, this.center[1]+this.half, this.center[2]-this.half, ...this.colors[1],0,0,0,1,1,
            this.center[0]-this.half, this.center[1]-this.half, this.center[2]-this.half, ...this.colors[1],0,0,0,0,0,
            this.center[0]+this.half, this.center[1]-this.half, this.center[2]-this.half, ...this.colors[1],0,0,0,1,0,
            this.center[0]+this.half, this.center[1]+this.half, this.center[2]-this.half, ...this.colors[1],0,0,0,1,1,
            
            // face de baixo
            this.center[0]-this.half, this.center[1]-this.half, this.center[2]+this.half, ...this.colors[2],0,0,0,0,1,
            this.center[0]+this.half, this.center[1]-this.half, this.center[2]+this.half, ...this.colors[2],0,0,0,1,1,
            this.center[0]-this.half, this.center[1]-this.half, this.center[2]-this.half, ...this.colors[2],0,0,0,0,0,
            this.center[0]+this.half, this.center[1]-this.half, this.center[2]-this.half, ...this.colors[2],0,0,0,1,0,
            this.center[0]+this.half, this.center[1]-this.half, this.center[2]+this.half, ...this.colors[2],0,0,0,1,1,
            
            // face de cima
            this.center[0]-this.half, this.center[1]+this.half, this.center[2]+this.half, ...this.colors[3],0,0,0,0,1,
            this.center[0]+this.half, this.center[1]+this.half, this.center[2]+this.half, ...this.colors[3],0,0,0,1,1,
            this.center[0]-this.half, this.center[1]+this.half, this.center[2]-this.half, ...this.colors[3],0,0,0,0,0,
            this.center[0]+this.half, this.center[1]+this.half, this.center[2]-this.half, ...this.colors[3],0,0,0,1,0,
            this.center[0]+this.half, this.center[1]+this.half, this.center[2]+this.half, ...this.colors[3],0,0,0,1,1,
            
            //Right face
            this.center[0] + this.half, this.center[1] + this.half, this.center[2] - this.half, ...this.colors[4],0,0,0,0,1,
            this.center[0] + this.half, this.center[1] + this.half, this.center[2] + this.half, ...this.colors[4],0,0,0,1,1,
            this.center[0] + this.half, this.center[1] - this.half, this.center[2] + this.half, ...this.colors[4],0,0,0,0,0,
            this.center[0] + this.half, this.center[1] - this.half, this.center[2] - this.half, ...this.colors[4],0,0,0,1,0,
            this.center[0] + this.half, this.center[1] + this.half, this.center[2] - this.half, ...this.colors[4],0,0,0,1,1,
            
            // Left face
            this.center[0] - this.half, this.center[1] + this.half, this.center[2] - this.half, ...this.colors[5],0,0,0,0,1,
            this.center[0] - this.half, this.center[1] + this.half, this.center[2] + this.half, ...this.colors[5],0,0,0,1,1,
            this.center[0] - this.half, this.center[1] - this.half, this.center[2] + this.half, ...this.colors[5],0,0,0,0,0,
            this.center[0] - this.half, this.center[1] - this.half, this.center[2] - this.half, ...this.colors[5],0,0,0,1,0,
            this.center[0] - this.half, this.center[1] + this.half, this.center[2] - this.half, ...this.colors[5],0,0,0,1,1
        ])

        this.genNormals();
    }

    constructor(center, side, colors, context, texture) {
        this.half = side/2;
        this.side = side;
        this.context = context;
        this.center = center;
        this.colors = colors;
        this.texture = texture;

        this.genGeometry();
    }

    draw(cameraDir) {
        //console.log(cameraPos);
        this.bufPtr = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPtr);
        gl.bufferData(gl.ARRAY_BUFFER, this.points, gl.STATIC_DRAW);
        
        //Pega ponteiro para o atributo "position" do vertex shader
        this.positionPtr = gl.getAttribLocation(prog, "position");
        console.log('testeeee: ', this.positionPtr);
        gl.enableVertexAttribArray([this.positionPtr]);
        //Especifica a cÃ³pia dos valores do buffer para o atributo
        gl.vertexAttribPointer(this.positionPtr,
            3,        //quantidade de dados em cada processamento
            gl.FLOAT, //tipo de cada dado (tamanho)
            false,    //nÃ£o normalizar
            11*4,      //tamanho do bloco de dados a processar em cada passo
            //0 indica que o tamanho do bloco Ã© igual a tamanho
            //lido (2 floats, ou seja, 2*4 bytes = 8 bytes)
            0         //salto inicial (em bytes)
            ); 
            
        this.fcolorPtr = gl.getAttribLocation(prog, "fcolor");
        gl.enableVertexAttribArray([this.fcolorPtr]);

        
        gl.vertexAttribPointer(this.fcolorPtr, 3, gl.FLOAT, false, 11 * 4, 3 * 4);

        this.fnormal = gl.getAttribLocation(prog, "vnormal");

        gl.enableVertexAttribArray(this.fnormal);
        gl.vertexAttribPointer(this.fnormal, 3, gl.FLOAT, false, 11 * 4, 6 * 4);

        this.textureTrue = gl.getUniformLocation(prog, "useTexture");
        // Atribuir o valor da constante à variável uniforme
        gl.uniform1i(this.textureTrue, this.texture == true ? 1 : 0);

        if(this.texture) {
            var texcoordPtr = gl.getAttribLocation(prog, "texCoord");
            gl.enableVertexAttribArray(texcoordPtr);
            gl.vertexAttribPointer(texcoordPtr, 
                                    2,        //quantidade de dados em cada processamento
                                    gl.FLOAT, //tipo de cada dado (tamanho)
                                    false,    //nÃ£o normalizar
                                    11*4,      //tamanho do bloco de dados a processar em cada passo
                                                //0 indica que o tamanho do bloco Ã© igual a tamanho
                                                //lido (2 floats, ou seja, 2*4 bytes = 8 bytes)
                                    9*4       //salto inicial (em bytes)
                                    );
                                    
            //submeter textura para gpu
            var tex0 = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tex0);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);      
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, teximg[0]);

            var texPtr = gl.getUniformLocation(prog, "tex");
        }

        if(cameraDir) {
            const cameraDirection = gl.getUniformLocation(prog, "cameraDirection");

            // Atribuir o valor da constante à variável uniforme
            gl.uniform3fv(cameraDirection, cameraDir);
        }

        for(var j = 0; j < 6; j++) {
            if(this.texture) gl.uniform1i(texPtr, 0);
            this.context.drawArrays(this.context.TRIANGLES, j*5, 3); 
            if(this.texture) gl.uniform1i(texPtr, 0);
            this.context.drawArrays(this.context.TRIANGLES, j*5+2, 3);
        }
    }

    translating(x, y, z) {
        const transMatrix = translatingMatrix([x, y, z]);

        for(var i = 0; i < 30; i++) {
            var point = math.matrix([[this.points[i*11]], [this.points[i*11+1]], [this.points[i*11+2]], [1]]);
            point = math.multiply(transMatrix, point)._data;
            point = [point[0][0], point[1][0], point[2][0]];

            this.points[i*11]   = point[0];  
            this.points[i*11+1] = point[1];  
            this.points[i*11+2] = point[2];  
        }

        this.center = math.multiply(transMatrix, math.matrix([[this.center[0]], [this.center[1]], [this.center[2]], [1]]))._data;
        this.center = [this.center[0][0], this.center[1][0], this.center[2][0]];    

        this.genNormals();
    }

    rotate(axis, angle) {
        const rotMat = axis == 'X' ? rotateX(angle) : axis == 'Y' ? rotateY(angle) : rotateZ(angle);

        for(var i = 0; i < 30; i++) {
            var point = math.matrix([[this.points[i*11]], [this.points[i*11+1]], [this.points[i*11+2]], [1]]);
            point = math.multiply(rotMat, point)._data;
            point = [point[0][0], point[1][0], point[2][0]];

            this.points[i*11]   = point[0];  
            this.points[i*11+1] = point[1];  
            this.points[i*11+2] = point[2];  
        }

        this.center = math.multiply(rotMat, math.matrix([[this.center[0]], [this.center[1]], [this.center[2]], [1]]))._data;
        this.center = [this.center[0][0], this.center[1][0], this.center[2][0]];    

        this.genNormals();
    }

    scaling(x, y, z) {
        var oldCenter = this.center;
        this.translating(-this.center[0],-this.center[1],-this.center[2]);

        const scaleMatrix = scalingMatrix(x, y, z);

        for(var i = 0; i < 30; i++) {
            var point = math.matrix([[this.points[i*11]], [this.points[i*11+1]], [this.points[i*11+2]], [1]]);
            point = math.multiply(scaleMatrix, point)._data;
            point = [point[0][0], point[1][0], point[2][0]];

            this.points[i*11]   = point[0];  
            this.points[i*11+1] = point[1];  
            this.points[i*11+2] = point[2];  
        }

        this.center = math.multiply(scaleMatrix, math.matrix([[this.center[0]], [this.center[1]], [this.center[2]], [1]]))._data;
        this.center = [this.center[0][0], this.center[1][0], this.center[2][0]];    

        this.translating(oldCenter[0],oldCenter[1],oldCenter[2]);
        this.genNormals();
    }


    selfRotate(axis, angle) {
        var oldCenter = this.center;
        this.translating(-this.center[0], -this.center[1], -this.center[2]);
        this.rotate(axis, angle);
        this.translating(...oldCenter);
    }
};

function createPerspective(fovy, aspect, near, far) {
    fovy = fovy*Math.PI/180.0;

    var fy = 1/math.tan(fovy/2.0);
    var fx = fy/aspect;
    var B  = -2*far*near/(far-near);
    var A  = -(far+near)/(far-near);

	var proj = math.matrix(
							[[ fx, 0.0,  0.0, 0.0],
							 [0.0,  fy,  0.0, 0.0],
							 [0.0, 0.0,    A,   B],
							 [0.0, 0.0, -1.0, 0.0]]
							);
							
	return proj;
}

function translatingMatrix(point) {
    return math.matrix([
        [1, 0, 0, point[0]],
        [0, 1, 0, point[1]],
        [0, 0, 1, point[2]],
        [0, 0, 0, 1]
    ]);
}

function scalingMatrix(x, y, z) {
    return math.matrix([
        [x, 0, 0, 0],
        [0, y, 0, 0],
        [0, 0, z, 0],
        [0, 0, 0, 1]
    ]);
}

function identity() {
    return math.matrix([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]);
}

class Camera {
    addTransformation(transformation) {
        this.transformations    = math.multiply(this.transformations, transformation);
        this.hasTransformations = true;
    }

    resetTransformations() {
        this.hasTransformations = false;
        this.transformations    = identity();
    }

    constructor(pos, target, up) {
        this.pos = pos;
        //this.target = math.divide(target, math.norm(target));
        this.target = target;
        this.up = up;
        this.resetTransformations();
        this.hasTransformations = true;
        this.mproj = createPerspective(20, gl.canvas.width/gl.canvas.height, 1, 10000);
        this.applyTransform();
    }

    reloadCamPosition() {
        var zc = math.subtract(this.pos, this.target);
        zc = math.divide(zc, math.norm(zc));
        
        var yt = math.subtract(this.up, this.pos);
        yt = math.divide(yt, math.norm(yt));
        
        this.xDir = math.cross(yt, zc);
        this.xDir = math.divide(this.xDir, math.norm(this.xDir));
        
        var yc = math.cross(zc, this.xDir);
        yc = math.divide(yc,math.norm(yc));
        
        var mt = math.inv(math.transpose(math.matrix([this.xDir,yc,zc])));
        
        mt = math.resize(mt, [4,4], 0);
        mt._data[3][3] = 1;
        
        var mov = math.matrix([[1, 0, 0, -this.pos[0]],
                               [0, 1, 0, -this.pos[1]],
                               [0, 0, 1, -this.pos[2]],
                               [0, 0, 0, 1]]);
        
        this.cam = math.multiply(mt, mov);
    }

    direction() {
        var direction = math.subtract(this.target, this.pos);
        return math.divide(direction, math.norm(direction));
    }

    rightVec() {
        return this.xDir;
    }

    applyTransform() {
        if(this.hasTransformations == true) {
            this.reloadCamPosition();
            var transform = math.multiply(this.cam, this.transformations);
            transform = math.multiply(this.mproj, transform);
            
            transform = math.flatten(math.transpose(transform))._data;
    
            var transfPtr = gl.getUniformLocation(prog, "transf");
            gl.uniformMatrix4fv(transfPtr, false, transform);

            this.resetTransformations();

            return transform;
        }

        return identity();
    }

    translating(x, y, z) {
        const transMatrix = translatingMatrix([x, y, z]);

        this.pos    = math.multiply(transMatrix, math.matrix([[this.pos[0]], [this.pos[1]], [this.pos[2]], [1]]))._data;
        this.up     = math.multiply(transMatrix, math.matrix([[this.up[0]], [this.up[1]], [this.up[2]], [1]]))._data;
        this.target = math.multiply(transMatrix, math.matrix([[this.target[0]], [this.target[1]], [this.target[2]], [1]]))._data;
        this.xDir = math.multiply(transMatrix, math.matrix([[this.xDir[0]], [this.xDir[1]], [this.xDir[2]], [1]]))._data;

        this.pos = [this.pos[0][0], this.pos[1][0], this.pos[2][0]];    
        this.up  = [this.up[0][0], this.up[1][0], this.up[2][0]];
        this.target  = [this.target[0][0], this.target[1][0], this.target[2][0]];
        this.xDir  = [this.xDir[0][0], this.xDir[1][0], this.xDir[2][0]];
        

        this.addTransformation(transMatrix);
    }

    rotate(axis, angle) {
        const rotMat = axis == 'X' ? rotateX(angle) : axis == 'Y' ? rotateY(angle) : rotateZ(angle);

        this.pos = math.multiply(rotMat, math.matrix([[this.pos[0]], [this.pos[1]], [this.pos[2]], [1]]))._data;
        this.up  = math.multiply(rotMat, math.matrix([[this.up[0]], [this.up[1]], [this.up[2]], [1]]))._data;
        this.target = math.multiply(rotMat, math.matrix([[this.target[0]], [this.target[1]], [this.target[2]], [1]]))._data;
        this.xDir = math.multiply(rotMat, math.matrix([[this.xDir[0]], [this.xDir[1]], [this.xDir[2]], [1]]))._data;

        this.pos = [this.pos[0][0], this.pos[1][0], this.pos[2][0]];    
        this.up  = [this.up[0][0], this.up[1][0], this.up[2][0]];
        this.target  = [this.target[0][0], this.target[1][0], this.target[2][0]];
        this.xDir  = [this.xDir[0][0], this.xDir[1][0], this.xDir[2][0]];
        
        this.addTransformation(rotMat);
    }
}

//var initializeCam = 0
var camera = undefined;
var cube   = undefined;

var rotationAngle = 3.14/4;

var diffuseLight;

function randomColor() {
    return [Math.random(), Math.random(), Math.random()];
}

function draw() {
    if(cube == undefined) {
        cube = [];

        var position = [0, 0, 0];

        var trans = [0, 0, 0, 0]
        
        for(var i = 0; i < 20; i++) {
            var color = randomColor();
            if(i%3) {
                cube.push(new Cube(position, 5, [color, color, color, color, color, color], gl, true));
            } else {
                cube.push(new Cube(position, 5, [color, color, color, color, color, color], gl, false));
            }

            if(i < 5) {
                cube[i].translating(trans[0], 0, 0);
                trans[0] += 10;
            } else if(i < 10) {
                cube[i].translating(-trans[1], 0, 0);
                trans[1] += 10;
            } else if(i < 15) {
                cube[i].translating(0, 0, trans[2]);
                trans[2] += 10;
            } else {
                cube[i].translating(0, 0, -trans[3]);
                trans[3] += 10;
            }

            cube[i].rotate('X', 45);
        }

    }

    if(camera == undefined) {
        var ambientLight = new AmbientLight([0.2, 0.2, 0.2, 1]);
        diffuseLight = new DiffuseLight([1, 1, 1, 1], [0, 20, -20,1]);
        camera = new Camera([0, 0, 100], [0,0, -20], [0, 1, 100]);

        Mousetrap.bind('w', function() {
            var direction = camera.direction();
            camera.translating(direction[0]*20, direction[1]*20, direction[2]*20);
        });
        Mousetrap.bind('s', function() { 
            var direction = camera.direction();
            camera.translating(-direction[0]*20, -direction[1]*20, -direction[2]*20); 
        });
        Mousetrap.bind('a', function() {
            var curPos = camera.pos;
            camera.translating(-curPos[0], -curPos[1], -curPos[2]);
            camera.rotate('Y', -3.14/2); console.log(camera.target);
            camera.translating(...curPos);
        });

        Mousetrap.bind('d', function() {
            var curPos = camera.pos;
            camera.translating(-curPos[0], -curPos[1], -curPos[2]);
            camera.rotate('Y', 3.14/2);
            camera.translating(...curPos);
        });
        Mousetrap.bind('up', function() { 
            var up = math.divide(camera.up, math.norm(camera.up));
            camera.translating(0, 1, 0);
        });
        Mousetrap.bind('down', function() { 
            var up = math.divide(camera.up, math.norm(camera.up));
            camera.translating(0, -1, 0);
        });
        Mousetrap.bind('right', function() { 
            var dir = camera.rightVec();
            camera.translating(dir[0]*3, dir[1]*3, dir[2]*3);
        });
        Mousetrap.bind('left', function() {
            var dir = camera.rightVec();
            camera.translating(-dir[0]*3, -dir[1]*3, -dir[2]*3);
        });
    }

    
    gl.clearColor(0.3, 0.3, 0.3, 1);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
    for(var i = 0; i < cube.length; i++) {
        cube[i].rotate('Y', rotationAngle);
        cube[i].draw(camera.pos);
    }
    
    camera.applyTransform();

    requestAnimationFrame(draw);
}