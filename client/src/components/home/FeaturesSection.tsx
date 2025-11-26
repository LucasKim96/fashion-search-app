import React from "react";
import { Zap, Gem, ShieldCheck } from "lucide-react";

export const FeaturesSection = () => (
	<section className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
		<FeatureCard
			icon={Zap}
			title="Nhanh chóng"
			desc="Tìm kiếm sản phẩm chỉ trong vài giây với công nghệ nhận diện hình ảnh tiên tiến."
		/>
		<FeatureCard
			icon={Gem}
			title="Độc đáo"
			desc="Khám phá hàng ngàn sản phẩm độc đáo từ các cửa hàng trên toàn quốc."
		/>
		<FeatureCard
			icon={ShieldCheck}
			title="An toàn"
			desc="Giao dịch an toàn, đảm bảo chất lượng từ các cửa hàng đã được xác thực."
		/>
	</section>
);

// Component nhỏ nội bộ để tái sử dụng style
const FeatureCard = ({ icon: Icon, title, desc }: any) => (
	<div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/30">
		<div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 mb-6">
			<Icon className="w-8 h-8 text-primary-dark group-hover:text-black transition-colors" />
		</div>
		<h3 className="text-xl font-bold text-secondary-dark group-hover:text-secondary transition-colors">
			{title}
		</h3>
		<p className="text-text-muted mt-3 leading-relaxed">{desc}</p>
	</div>
);
