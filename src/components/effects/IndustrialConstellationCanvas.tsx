import { useEffect, useRef } from "react";
import * as THREE from "three";

interface RenderState {
  pulse: number;
  isTextVisible: boolean;
  mouseX: number;
  mouseY: number;
}

export default function IndustrialConstellationCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.set(0, 0, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const nodeCount = 60;
    const nodes: THREE.Vector3[] = [];
    const lineKeys: string[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = 60 + Math.random() * 80;
      const p = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      nodes.push(p);
    }

    const lineGeom = new THREE.BufferGeometry();
    const MAX_PER_NODE = 4;
    const pos: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const p1 = nodes[i];
      let count = 0;
      const distances: { j: number; d: number }[] = [];

      for (let j = 0; j < nodeCount; j++) {
        if (i === j) continue;
        const d = p1.distanceTo(nodes[j]);
        distances.push({ j, d });
      }

      distances.sort((a, b) => a.d - b.d);

      for (const item of distances) {
        if (count >= MAX_PER_NODE) break;
        const p2 = nodes[item.j];
        const key = [Math.min(i, item.j), Math.max(i, item.j)].join("-");

        if (lineKeys.indexOf(key) === -1) {
          lineKeys.push(key);
          pos.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
          let alpha = 1.0 - item.d / 180;
          alpha = Math.max(0, alpha);
          const c1 = new THREE.Color(0xff2a00);
          colors.push(
            c1.r * alpha, c1.g * alpha, c1.b * alpha,
            c1.r * alpha, c1.g * alpha, c1.b * alpha
          );
          count++;
        }
      }
    }

    lineGeom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(pos, 3)
    );
    lineGeom.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    const linesMesh = new THREE.LineSegments(
      lineGeom,
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        vertexColors: true,
      })
    );
    scene.add(linesMesh);

    const nodesGeom = new THREE.BufferGeometry().setFromPoints(nodes);
    const nodesMesh = new THREE.Points(
      nodesGeom,
      new THREE.PointsMaterial({
        color: 0xff2a00,
        size: 1.5,
        transparent: true,
        opacity: 0.8,
      })
    );
    scene.add(nodesMesh);

    const starNodes = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(nodes),
      new THREE.PointsMaterial({
        color: 0xffb800,
        size: 3.0,
        transparent: true,
        opacity: 0.9,
      })
    );
    scene.add(starNodes);

    const renderState: RenderState = {
      pulse: 0,
      isTextVisible: true,
      mouseX: 0,
      mouseY: 0,
    };

    function animatePulse() {
      renderState.pulse += 0.02;
      starNodes.position.x = Math.sin(renderState.pulse) * 15;
      starNodes.position.x +=
        (renderState.mouseX - starNodes.position.x) * 0.05;
      starNodes.position.y +=
        (-renderState.mouseY - starNodes.position.y) * 0.05;

      const nMesh = scene.children[1];
      if (nMesh) {
        nMesh.rotateOnAxis(
          new THREE.Vector3(0, 1, 0).normalize(),
          0.002
        );
      }

      const lMesh = scene.children[0] as THREE.LineSegments;
      if (lMesh && lMesh.material) {
        (lMesh.material as THREE.LineBasicMaterial).opacity =
          0.3 + Math.sin(renderState.pulse * 2) * 0.2;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animatePulse);
    }

    animatePulse();

    const onMouseMove = (event: MouseEvent) => {
      renderState.mouseX =
        (event.clientX - window.innerWidth / 2) * 0.5;
      renderState.mouseY =
        (event.clientY - window.innerHeight / 2) * 0.5;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}
