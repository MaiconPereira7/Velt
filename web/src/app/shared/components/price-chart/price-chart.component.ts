import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoService } from '../../../core/services/crypto.service';

interface Period {
  label: string;
  days: number;
}

interface TooltipData {
  date: string;
  price: string;
}

const PERIODS: Period[] = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

// Gráfico de linha em Canvas 2D puro — sem lib de gráficos, de propósito
// (o pedido era explicitamente "não instale Chart.js nem nenhuma lib externa").
@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './price-chart.component.html',
  styleUrls: ['./price-chart.component.scss'],
})
export class PriceChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) coinId!: string;
  @Input({ required: true }) coinName!: string;
  // Modo compacto (usado no mini-gráfico do Dashboard): sem botões de período,
  // sem tooltip, sem eixos — só a linha.
  @Input() compact = false;

  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('wrapper') private wrapperRef!: ElementRef<HTMLDivElement>;

  private crypto = inject(CryptoService);
  private resizeObserver?: ResizeObserver;

  readonly periods = PERIODS;

  selectedDays = 7;
  loading = true;
  error: string | null = null;
  points: [number, number][] = [];

  hoverIndex: number | null = null;
  hoverX = 0;
  hoverY = 0;

  ngOnInit(): void {
    if (this.compact) this.selectedDays = 1;
    this.load();
  }

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.draw());
    this.resizeObserver.observe(this.wrapperRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  selectPeriod(days: number): void {
    if (this.selectedDays === days) return;
    this.selectedDays = days;
    this.load();
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.points = await this.crypto.getPriceHistory(this.coinId, this.selectedDays);
    } catch {
      this.error = 'Não foi possível carregar o histórico de preço.';
      this.points = [];
    } finally {
      this.loading = false;
      this.draw();
    }
  }

  get tooltip(): TooltipData | null {
    if (this.compact || this.hoverIndex === null) return null;
    const point = this.points[this.hoverIndex];
    if (!point) return null;
    return {
      date: new Date(point[0]).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      price: point[1].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    };
  }

  onMouseMove(event: MouseEvent): void {
    if (this.compact || this.points.length === 0) return;
    const rect = this.wrapperRef.nativeElement.getBoundingClientRect();
    const { left, chartWidth } = this.layout(rect.width);
    const x = event.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, (x - left) / chartWidth));
    const index = Math.round(ratio * (this.points.length - 1));

    this.hoverIndex = index;
    this.hoverX = event.clientX - rect.left;
    this.hoverY = event.clientY - rect.top;
    this.draw();
  }

  onMouseLeave(): void {
    this.hoverIndex = null;
    this.draw();
  }

  // Calcula o retângulo útil do gráfico (descontando margem pros eixos) — usado
  // tanto no desenho quanto no cálculo de posição do mouse pro tooltip.
  private layout(width: number) {
    const left = this.compact ? 4 : 56;
    const right = this.compact ? 4 : 16;
    return { left, right, chartWidth: Math.max(1, width - left - right) };
  }

  private draw(): void {
    const canvas = this.canvasRef?.nativeElement;
    const wrapper = this.wrapperRef?.nativeElement;
    if (!canvas || !wrapper) return;

    const dpr = window.devicePixelRatio || 1;
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    if (width === 0 || height === 0) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const data = this.points;
    if (data.length === 0) return;

    const top = 12;
    const bottom = this.compact ? 4 : 24;
    const { left, chartWidth } = this.layout(width);
    const chartHeight = Math.max(1, height - top - bottom);

    const prices = data.map(p => p[1]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const xFor = (i: number) =>
      data.length > 1 ? left + (i / (data.length - 1)) * chartWidth : left + chartWidth / 2;
    const yFor = (price: number) => top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

    // Grade + eixo Y (preços) — só no modo completo
    if (!this.compact) {
      ctx.font = '10px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#4a4e65';
      ctx.textAlign = 'right';
      const ySteps = 4;
      for (let s = 0; s <= ySteps; s++) {
        const price = minPrice + (priceRange * s) / ySteps;
        const y = yFor(price);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(left + chartWidth, y);
        ctx.stroke();
        ctx.fillText(this.formatCompactBrl(price), left - 8, y + 3);
      }
    }

    // Área preenchida sob a linha (gradiente laranja -> transparente)
    const gradient = ctx.createLinearGradient(0, top, 0, top + chartHeight);
    gradient.addColorStop(0, 'rgba(247, 147, 26, 0.15)');
    gradient.addColorStop(1, 'rgba(247, 147, 26, 0)');

    ctx.beginPath();
    data.forEach((p, i) => {
      const x = xFor(i), y = yFor(p[1]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.lineTo(xFor(data.length - 1), top + chartHeight);
    ctx.lineTo(xFor(0), top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Linha do preço
    ctx.beginPath();
    data.forEach((p, i) => {
      const x = xFor(i), y = yFor(p[1]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#f7931a';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Eixo X (datas) — só no modo completo
    if (!this.compact) {
      ctx.fillStyle = '#4a4e65';
      ctx.textAlign = 'center';
      const xSteps = Math.min(5, data.length - 1);
      for (let s = 0; s <= xSteps; s++) {
        const i = Math.round((s / xSteps) * (data.length - 1));
        const point = data[i];
        if (!point) continue;
        ctx.fillText(this.formatDate(point[0]), xFor(i), height - 6);
      }
    }

    // Marcador de hover
    if (this.hoverIndex !== null && data[this.hoverIndex]) {
      const point = data[this.hoverIndex]!;
      const x = xFor(this.hoverIndex), y = yFor(point[1]);

      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + chartHeight);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f7931a';
      ctx.fill();
    }
  }

  private formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  private formatCompactBrl(value: number): string {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: value >= 1000 ? 0 : 2 });
  }
}
