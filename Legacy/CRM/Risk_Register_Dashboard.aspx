<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Risk_Register_Dashboard.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Medium"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <div align="center">
                    
                    <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                        Width="1176px">
                 
                 <table style="width: 96%; margin-left: 0px;" align="center">
                                <tr>
                                    <td class="style8">
                                      <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" Width="1190px">
                            <table style="1100: ;">
                                <tr>
                                    <td align="center" bgcolor="#CCCCCC">
                                        <asp:Label ID="Label135" runat="server" Font-Bold="True" 
                                            Text="DASHBOARD" Font-Size="Medium"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table style="width: 1132px">
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Panel ID="Panel25" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                                        Height="38px">
                                                        <table style="width: 100%">
                                                            <tr>
                                                                <td style="width: 85px; height: 33px">
                                                                    <asp:Label ID="Label210" runat="server" style="font-weight: 700" 
                                                                        Text="Date From"></asp:Label>
                                                                </td>
                                                                <td style="width: 136px; height: 33px">
                                                                    <telerik:RadDatePicker ID="dtdatefrom" Runat="server" Skin="Simple">
                                                                        <Calendar Skin="Simple" UseColumnHeadersAsSelectors="False" 
                                                                            UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                        </Calendar>
                                                                        <DateInput DateFormat="dd-MMM-yyyy" DisplayDateFormat="dd-MMM-yyyy">
                                                                        </DateInput>
                                                                        <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                    </telerik:RadDatePicker>
                                                                </td>
                                                                <td style="width: 92px; height: 33px">
                                                                    <asp:Label ID="Label209" runat="server" style="font-weight: 700" Text="Date To"></asp:Label>
                                                                </td>
                                                                <td style="width: 160px; height: 33px">
                                                                    <telerik:RadDatePicker ID="dtdateto" Runat="server" Skin="Simple">
                                                                        <Calendar Skin="Simple" UseColumnHeadersAsSelectors="False" 
                                                                            UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                                        </Calendar>
                                                                        <DateInput DateFormat="dd-MMM-yyyy" DisplayDateFormat="dd-MMM-yyyy">
                                                                        </DateInput>
                                                                        <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                                    </telerik:RadDatePicker>
                                                                </td>
                                                                <td style="height: 33px">
                                                                    <telerik:RadButton ID="RadButton2" runat="server" Skin="Simple" Text="View" 
                                                                        Width="126px">
                                                                    </telerik:RadButton>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </asp:Panel>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Label ID="Label1" runat="server" Font-Size="Small" 
                                                        style="font-weight: 700" Text="OVERAL SUMMARY-TOP 15"></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Panel ID="Panel3" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GDOVERAL" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="50" Skin="Simple" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridBoundColumn DataField="Department" 
                                                                        FilterControlAltText="Filter Department column" HeaderText="Department" 
                                                                        SortExpression="Department" UniqueName="Department">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Risk_Title" 
                                                                        FilterControlAltText="Filter Risk_Title column" HeaderText="Risk_Title" 
                                                                        SortExpression="Risk_Title" UniqueName="Risk_Title">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Risk_Descr" 
                                                                        FilterControlAltText="Filter Risk_Descr column" HeaderText="Risk_Descr" 
                                                                        SortExpression="Risk_Descr" UniqueName="Risk_Descr">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Inh_Risk_Exposure" 
                                                                        FilterControlAltText="Filter Inh_Risk_Exposure column" 
                                                                        HeaderText="Inh_Risk_Exposure" SortExpression="Inh_Risk_Exposure" 
                                                                        UniqueName="Inh_Risk_Exposure">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Control_Eff" 
                                                                        FilterControlAltText="Filter Control_Eff  column" 
                                                                        HeaderText="Control effectiveness" SortExpression="Control_Eff" 
                                                                        UniqueName="Control_Eff">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="R_Risk_Exposure" 
                                                                        FilterControlAltText="Filter R_Risk_Exposure column" 
                                                                        HeaderText="Residual_Risk_Exposure" SortExpression="R_Risk_Exposure" 
                                                                        UniqueName="R_Risk_Exposure">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <PagerStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Label ID="Label211" runat="server" Font-Size="Small" 
                                                        style="font-weight: 700" Text="OVERDUE-TOP 10 "></asp:Label>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Panel ID="Panel29" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GDOVERDUE" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="50" Skin="Simple" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridBoundColumn DataField="Department" 
                                                                        FilterControlAltText="Filter Department column" HeaderText="Department" 
                                                                        SortExpression="Department" UniqueName="Department">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Risk_Title" 
                                                                        FilterControlAltText="Filter Risk_Title column" HeaderText="Risk_Title" 
                                                                        SortExpression="Risk_Title" UniqueName="Risk_Title">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Risk_Descr" 
                                                                        FilterControlAltText="Filter Risk_Descr column" HeaderText="Risk_Descr" 
                                                                        SortExpression="Risk_Descr" UniqueName="Risk_Descr">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Inh_Risk_Exposure" 
                                                                        FilterControlAltText="Filter Inh_Risk_Exposure column" 
                                                                        HeaderText="Inh_Risk_Exposure" SortExpression="Inh_Risk_Exposure" 
                                                                        UniqueName="Inh_Risk_Exposure">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Control_Eff" 
                                                                        FilterControlAltText="Filter Control_Eff  column" 
                                                                        HeaderText="Control effectiveness" SortExpression="Control_Eff" 
                                                                        UniqueName="Control_Eff">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="R_Risk_Exposure" 
                                                                        FilterControlAltText="Filter R_Risk_Exposure column" 
                                                                        HeaderText="Residual_Risk_Exposure" SortExpression="R_Risk_Exposure" 
                                                                        UniqueName="R_Risk_Exposure">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <PagerStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="3">
                                                    <asp:Panel ID="Panel12" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="1142px">
                                                        <telerik:RadGrid ID="GDDEPART" runat="server" AllowPaging="True" 
                                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="20" Skin="Simple" 
                                                            Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="Id">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridButtonColumn CommandName="Select" 
                                                                        FilterControlAltText="Filter Depart_Code column" HeaderText="Select" 
                                                                        Text="Select" UniqueName="Select">
                                                                        <HeaderStyle ForeColor="Blue" Width="50px" />
                                                                        <ItemStyle Width="50px" />
                                                                    </telerik:GridButtonColumn>
                                                                    <telerik:GridBoundColumn DataField="Depart_Code" 
                                                                        FilterControlAltText="Filter Depart_Code column" HeaderText="Depart_Code" 
                                                                        SortExpression="Depart_Code" UniqueName="Depart_Code">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Period_From" 
                                                                        FilterControlAltText="Filter Period_From column" HeaderText="Period_From" 
                                                                        SortExpression="Period_From" UniqueName="Period_From">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Period_To" 
                                                                        FilterControlAltText="Filter Period_To column" HeaderText="Period_To" 
                                                                        SortExpression="Period_To" UniqueName="Period_To">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Department" 
                                                                        FilterControlAltText="Filter Department column" HeaderText="Department" 
                                                                        SortExpression="Department" UniqueName="Department">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Risk_Owner" 
                                                                        FilterControlAltText="Filter Risk_Owner column" HeaderText="Risk_Owner" 
                                                                        SortExpression="Risk_Owner" UniqueName="Risk_Owner">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Champion_Name" 
                                                                        FilterControlAltText="Filter Champion_Name column" HeaderText="Champion_Name" 
                                                                        SortExpression="Champion_Name" UniqueName="Champion_Name">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Status" 
                                                                        FilterControlAltText="Filter Status column" HeaderText="Status" 
                                                                        SortExpression="Status" UniqueName="Status">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Due_Date" 
                                                                        FilterControlAltText="Filter Due_Date column" HeaderText="Due_Date" 
                                                                        SortExpression="Due_Date" UniqueName="Due_Date">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <ItemStyle Wrap="False" />
                                                            <PagerStyle Wrap="False" />
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 1025px">
                                                    <asp:Label ID="FILE_NO" runat="server" Font-Bold="True" Font-Size="Small" 
                                                        style="font-weight: 700; color: #CC0000; background-color: #FFFFFF"></asp:Label>
                                                </td>
                                                <td style="width: 125px">
                                                    &nbsp;</td>
                                                <td style="width: 264px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <telerik:RadTabStrip ID="RadTabStrip1" runat="server" 
                                                        MultiPageID="RadMultiPage1" SelectedIndex="0">
                                                        <Tabs>
                                                            <telerik:RadTab runat="server" PageViewID="V1" Text="Risk Register" 
                                                                Selected="True" SelectedIndex="0">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" PageViewID="V2" Text="Risk Summary">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" PageViewID="V3" Text="Top 10 Risks">
                                                            </telerik:RadTab>
                                                            <telerik:RadTab runat="server" PageViewID="V4" Text="Overdue Risks">
                                                            </telerik:RadTab>
                                                        </Tabs>
                                                    </telerik:RadTabStrip>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="1121px">
                                                        <telerik:RadPageView ID="V1" runat="server" Width="1136px" Selected="True">
                                                            <asp:Panel ID="Panel19" runat="server">
                                                                <table style="width: 100%">
                                                                    <tr>
                                                                        <td colspan="4">
                                                                            <asp:Panel ID="Panel20" runat="server" Height="100%" ScrollBars="Both" 
                                                                                Width="1142px">
                                                                                <telerik:RadGrid ID="GD_RISK" runat="server" AllowPaging="True" 
                                                                                    CellSpacing="0" GridLines="None" Height="100%" PageSize="50" Skin="Simple" 
                                                                                    Width="100%">
                                                                                    <MasterTableView AutoGenerateColumns="False" DataKeyNames="Risk_Code"> 
                                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                        <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                            <HeaderStyle Width="20px" />
                                                                                        </RowIndicatorColumn>
                                                                                        <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                            <HeaderStyle Width="20px" />
                                                                                        </ExpandCollapseColumn>
                                                                                        <Columns>
                                                                                     <telerik:GridButtonColumn CommandName="Select" 
                                                                                                FilterControlAltText="Filter Depart_Code column" HeaderText="Select" 
                                                                                                Text="Select" UniqueName="Select">
                                                                                                <HeaderStyle ForeColor="Blue" Width="50px" />
                                                                                                <ItemStyle Width="50px" />
                                                                                            </telerik:GridButtonColumn>
                                                                                            <telerik:GridBoundColumn DataField="Risk_Code" 
                                                                                                FilterControlAltText="Filter Risk_Code column" HeaderText="Risk_Code" 
                                                                                                SortExpression="Risk_Code" UniqueName="Risk_Code">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Depart_Objective" 
                                                                                                FilterControlAltText="Filter Depart_Objective column" HeaderText="Objective" 
                                                                                                SortExpression="Depart_Objective" UniqueName="Depart_Objective">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Risk_Title" 
                                                                                                FilterControlAltText="Filter Risk_Title column" HeaderText="Risk_Title" 
                                                                                                SortExpression="Risk_Title" UniqueName="Risk_Title">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Risk_Category" 
                                                                                                FilterControlAltText="Filter Risk_Category column" HeaderText="Risk_Category" 
                                                                                                SortExpression="Risk_Category" UniqueName="Risk_Category">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Risk_Impact" 
                                                                                                FilterControlAltText="Filter Risk_Impact column" HeaderText="Impact" 
                                                                                                SortExpression="Risk_Impact" UniqueName="Risk_Impact">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Risk_Likelihood" 
                                                                                                FilterControlAltText="Filter Risk_Likelihood column" HeaderText="Likelihood" 
                                                                                                SortExpression="Risk_Likelihood" UniqueName="Risk_Likelihood">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="I_Risk_Exposure" 
                                                                                                FilterControlAltText="Filter I_Risk_Exposure column" HeaderText="Inh_Exposure" 
                                                                                                SortExpression="I_Risk_Exposure" UniqueName="I_Risk_Exposure">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Perceived_Contr_Eff" 
                                                                                                FilterControlAltText="Filter Perceived_Contr_Eff column" 
                                                                                                HeaderText="Perceived_Contr" SortExpression="Perceived_Contr_Eff" 
                                                                                                UniqueName="Perceived_Contr_Eff">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Desired_Contr_Effe" 
                                                                                                FilterControlAltText="Filter Desired_Contr_Effe column" 
                                                                                                HeaderText="Desired_Contr" SortExpression="Desired_Contr_Effe" 
                                                                                                UniqueName="Desired_Contr_Effe">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="R_Risk_Exposure" 
                                                                                                FilterControlAltText="Filter R_Risk_Exposure column" HeaderText="Res_Exposure" 
                                                                                                SortExpression="R_Risk_Exposure" UniqueName="R_Risk_Exposure">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Action_Owner" 
                                                                                                FilterControlAltText="Filter Action_Owner column" HeaderText="Action_Owner" 
                                                                                                SortExpression="Action_Owner" UniqueName="Action_Owner">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Due_Date" DataFormatString="{0:yyyy-MM-dd}" 
                                                                                                FilterControlAltText="Filter Due_Date column" HeaderText="Due_Date" 
                                                                                                SortExpression="Due_Date" UniqueName="Due_Date">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Action_Status" 
                                                                                                FilterControlAltText="Filter Action_Status column" HeaderText="Action_Status" 
                                                                                                SortExpression="Action_Status" UniqueName="Action_Status">
                                                                                            </telerik:GridBoundColumn>
                                                                                        </Columns>
                                                                                        <EditFormSettings>
                                                                                            <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                            </EditColumn>
                                                                                        </EditFormSettings>
                                                                                    </MasterTableView>
                                                                                    <ItemStyle Wrap="False" />
                                                                                    <PagerStyle Wrap="False" />
                                                                                    <FilterMenu EnableImageSprites="False">
                                                                                    </FilterMenu>
                                                                                    <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                    </HeaderContextMenu>
                                                                                </telerik:RadGrid>
                                                                            </asp:Panel>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td colspan="4">
                                                                            <asp:Panel ID="Panel31" runat="server" Height="100%" ScrollBars="Both" 
                                                                                Width="1142px">
                                                                                <telerik:RadGrid ID="GD_RISK_ROOT" runat="server" AllowPaging="True" 
                                                                                    CellSpacing="0" GridLines="None" Height="100%" PageSize="50" Skin="Simple" 
                                                                                    Width="100%">
                                                                                    <MasterTableView AutoGenerateColumns="False" DataKeyNames="Root_ID">
                                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                        <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                        <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                            <HeaderStyle Width="20px" />
                                                                                        </RowIndicatorColumn>
                                                                                        <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                            <HeaderStyle Width="20px" />
                                                                                        </ExpandCollapseColumn>
                                                                                        <Columns>
                                                                                            <telerik:GridBoundColumn DataField="Root_Cause" 
                                                                                                FilterControlAltText="Filter Root_Cause column" HeaderText="Root_Cause" 
                                                                                                SortExpression="Root_Cause" UniqueName="Root_Cause">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Current_Contr" 
                                                                                                FilterControlAltText="Filter Current_Contr column" HeaderText="Current_Control" 
                                                                                                SortExpression="Current_Contr" UniqueName="Current_Contr">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Mitigations" 
                                                                                                FilterControlAltText="Filter Mitigations column" HeaderText="Mitigations" 
                                                                                                SortExpression="Mitigations" UniqueName="Mitigations">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Due_Date" 
                                                                                                FilterControlAltText="Filter Due_Date  column" HeaderText="Due_Date" 
                                                                                                SortExpression="Due_Date" UniqueName="Due_Date">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Action_Owner" 
                                                                                                FilterControlAltText="Filter Action_Owner column" HeaderText="Action_Owner" 
                                                                                                SortExpression="Action_Owner" UniqueName="Action_Owner">
                                                                                            </telerik:GridBoundColumn>
                                                                                            <telerik:GridBoundColumn DataField="Action_Status" 
                                                                                                FilterControlAltText="Filter Action_Status column" HeaderText="Action_Status" 
                                                                                                SortExpression="Action_Status" UniqueName="Action_Status">
                                                                                            </telerik:GridBoundColumn>
                                                                                        </Columns>
                                                                                        <EditFormSettings>
                                                                                            <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                            </EditColumn>
                                                                                        </EditFormSettings>
                                                                                    </MasterTableView>
                                                                                    <ItemStyle Wrap="False" />
                                                                                    <PagerStyle Wrap="False" />
                                                                                    <FilterMenu EnableImageSprites="False">
                                                                                    </FilterMenu>
                                                                                    <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                    </HeaderContextMenu>
                                                                                </telerik:RadGrid>
                                                                            </asp:Panel>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td>
                                                                            <asp:Label ID="Label189" runat="server" Text="Export To excel"></asp:Label>
                                                                        </td>
                                                                        <td style="width: 207px">
                                                                            &nbsp;</td>
                                                                        <td style="width: 103px">
                                                                            &nbsp;</td>
                                                                        <td>
                                                                            <asp:Label ID="LBLRISK" runat="server"></asp:Label>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V2" runat="server" Width="1136px">
                                                             <asp:Panel ID="Panel21" runat="server">
                                                                 <table style="width: 100%">
                                                                     <tr>
                                                                         <td bgcolor="#666666" style="height: 28px;">
                                                                             <asp:Label ID="Label207" runat="server" Text="Risk Processing" 
                                                                                 Font-Size="Medium" style="font-weight: 700"></asp:Label>
                                                                         </td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             <asp:Panel ID="Panel22" runat="server" Height="100%" ScrollBars="Both" 
                                                                                 Width="1142px">
                                                                                 <telerik:RadGrid ID="GD_RISK_SUM" runat="server" AllowPaging="True" 
                                                                                     CellSpacing="0" GridLines="None" Height="100%" PageSize="50" Skin="Simple" 
                                                                                     Width="100%">
                                                                                     <MasterTableView AutoGenerateColumns="False">
                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                         <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                             <HeaderStyle Width="20px" />
                                                                                         </RowIndicatorColumn>
                                                                                         <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                             <HeaderStyle Width="20px" />
                                                                                         </ExpandCollapseColumn>
                                                                                         <Columns>
                                                                                             <telerik:GridBoundColumn DataField="IR_Ranking" 
                                                                                                 FilterControlAltText="Filter IR_Ranking column" HeaderText="Ranking" 
                                                                                                 SortExpression="IR_Ranking" UniqueName="IR_Ranking">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Title_Reference" 
                                                                                                 FilterControlAltText="Filter Title_Reference column" 
                                                                                                 HeaderText="Title_Reference" SortExpression="Title_Reference" 
                                                                                                 UniqueName="Title_Reference">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Impact" 
                                                                                                 FilterControlAltText="Filter Impact column" HeaderText="Impact" 
                                                                                                 SortExpression="Impact" UniqueName="Impact">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Likelihood" 
                                                                                                 FilterControlAltText="Filter Likelihood column" HeaderText="Likelihood" 
                                                                                                 SortExpression="Likelihood" UniqueName="Likelihood">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Inh_Risk_Exposure" 
                                                                                                 FilterControlAltText="Filter Inh_Risk_Exposure column" 
                                                                                                 HeaderText="Inh_Risk_Exposure" SortExpression="Inh_Risk_Exposure" 
                                                                                                 UniqueName="Inh_Risk_Exposure">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Control_Eff" 
                                                                                                 FilterControlAltText="Filter Control_Eff  column" HeaderText="Control_Eff" 
                                                                                                 SortExpression="Control_Eff" UniqueName="Control_Eff">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="R_Risk_Exposure" 
                                                                                                 FilterControlAltText="Filter R_Risk_Exposure column" 
                                                                                                 HeaderText="R_Risk_Exposure" SortExpression="R_Risk_Exposure" 
                                                                                                 UniqueName="R_Risk_Exposure">
                                                                                             </telerik:GridBoundColumn>
                                                                                         </Columns>
                                                                                         <EditFormSettings>
                                                                                             <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                             </EditColumn>
                                                                                         </EditFormSettings>
                                                                                     </MasterTableView>
                                                                                     <ItemStyle Wrap="False" />
                                                                                     <PagerStyle Wrap="False" />
                                                                                     <FilterMenu EnableImageSprites="False">
                                                                                     </FilterMenu>
                                                                                     <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                     </HeaderContextMenu>
                                                                                 </telerik:RadGrid>
                                                                             </asp:Panel>
                                                                         </td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             &nbsp;</td>
                                                                     </tr>
                                                                 </table>
                                                             </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V3" runat="server" Width="1136px">
                                                             <asp:Panel ID="Panel23" runat="server">
                                                                 <table style="width: 100%">
                                                                     <tr>
                                                                         <td bgcolor="#666666">
                                                                             <asp:Label ID="Label208" runat="server" style="font-weight: 700" 
                                                                                 Text="RISK SUMMARY-TOP 10" Font-Size="Small"></asp:Label>
                                                                         </td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             <asp:Panel ID="Panel27" runat="server" Height="100%" ScrollBars="Both" 
                                                                                 Width="1142px">
                                                                                 <telerik:RadGrid ID="GD_RISK_SUM1" runat="server" AllowPaging="True" 
                                                                                     CellSpacing="0" GridLines="None" Height="100%" PageSize="50" Skin="Simple" 
                                                                                     Width="100%">
                                                                                     <MasterTableView AutoGenerateColumns="False">
                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                         <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                             <HeaderStyle Width="20px" />
                                                                                         </RowIndicatorColumn>
                                                                                         <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                             <HeaderStyle Width="20px" />
                                                                                         </ExpandCollapseColumn>
                                                                                         <Columns>
                                                                                        
                                                                                             <telerik:GridBoundColumn DataField="Department" 
                                                                                                 FilterControlAltText="Filter Department column" HeaderText="Department" 
                                                                                                 SortExpression="Department" UniqueName="Department">
                                                                                             </telerik:GridBoundColumn>
                                                                                        
                                                                                             <telerik:GridBoundColumn DataField="Risk_Title" 
                                                                                                 FilterControlAltText="Filter Risk_Title column" HeaderText="Risk_Title" 
                                                                                                 SortExpression="Risk_Title" UniqueName="Risk_Title">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Risk_Descr" 
                                                                                                 FilterControlAltText="Filter Risk_Descr column" HeaderText="Risk_Descr" 
                                                                                                 SortExpression="Risk_Descr" UniqueName="Risk_Descr">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Inh_Risk_Exposure" 
                                                                                                 FilterControlAltText="Filter Inh_Risk_Exposure column" HeaderText="Inh_Risk_Exposure" 
                                                                                                 SortExpression="Inh_Risk_Exposure" UniqueName="Inh_Risk_Exposure">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Control_Eff" 
                                                                                                 FilterControlAltText="Filter Control_Eff  column" HeaderText="Control effectiveness" 
                                                                                                 SortExpression="Control_Eff" UniqueName="Control_Eff">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="R_Risk_Exposure" 
                                                                                                 FilterControlAltText="Filter R_Risk_Exposure column" 
                                                                                                 HeaderText="Residual_Risk_Exposure" SortExpression="R_Risk_Exposure" 
                                                                                                 UniqueName="R_Risk_Exposure">
                                                                                             </telerik:GridBoundColumn>
                                                                                         </Columns>
                                                                                         <EditFormSettings>
                                                                                             <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                             </EditColumn>
                                                                                         </EditFormSettings>
                                                                                     </MasterTableView>
                                                                                     <ItemStyle Wrap="False" />
                                                                                     <PagerStyle Wrap="False" />
                                                                                     <FilterMenu EnableImageSprites="False">
                                                                                     </FilterMenu>
                                                                                     <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                     </HeaderContextMenu>
                                                                                 </telerik:RadGrid>
                                                                             </asp:Panel>
                                                                         </td>
                                                                     </tr>
                                                                 </table>
                                                             </asp:Panel>
                                                        </telerik:RadPageView>
                                                         <telerik:RadPageView ID="V4" runat="server" Width="1136px">
                                                             <asp:Panel ID="Panel2" runat="server">
                                                                 <table style="width: 100%">
                                                                     <tr>
                                                                         <td bgcolor="#666666">
                                                                             <asp:Label ID="Label212" runat="server" Font-Size="Small" 
                                                                                 style="font-weight: 700" Text="OVER DUE RISKS"></asp:Label>
                                                                         </td>
                                                                     </tr>
                                                                     <tr>
                                                                         <td>
                                                                             <asp:Panel ID="Panel30" runat="server" Height="100%" ScrollBars="Both" 
                                                                                 Width="1142px">
                                                                                 <telerik:RadGrid ID="GDOVERDUE_1" runat="server" AllowPaging="True" 
                                                                                     CellSpacing="0" GridLines="None" Height="100%" PageSize="50" Skin="Simple" 
                                                                                     Width="100%">
                                                                                     <MasterTableView AutoGenerateColumns="False">
                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                         <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                         <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                             <HeaderStyle Width="20px" />
                                                                                         </RowIndicatorColumn>
                                                                                         <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                             <HeaderStyle Width="20px" />
                                                                                         </ExpandCollapseColumn>
                                                                                         <Columns>
                                                                                             <telerik:GridBoundColumn DataField="Department" 
                                                                                                 FilterControlAltText="Filter Department column" HeaderText="Department" 
                                                                                                 SortExpression="Department" UniqueName="Department">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Risk_Title" 
                                                                                                 FilterControlAltText="Filter Risk_Title column" HeaderText="Risk_Title" 
                                                                                                 SortExpression="Risk_Title" UniqueName="Risk_Title">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Risk_Descr" 
                                                                                                 FilterControlAltText="Filter Risk_Descr column" HeaderText="Risk_Descr" 
                                                                                                 SortExpression="Risk_Descr" UniqueName="Risk_Descr">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Inh_Risk_Exposure" 
                                                                                                 FilterControlAltText="Filter Inh_Risk_Exposure column" 
                                                                                                 HeaderText="Inh_Risk_Exposure" SortExpression="Inh_Risk_Exposure" 
                                                                                                 UniqueName="Inh_Risk_Exposure">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Control_Eff" 
                                                                                                 FilterControlAltText="Filter Control_Eff  column" 
                                                                                                 HeaderText="Control effectiveness" SortExpression="Control_Eff" 
                                                                                                 UniqueName="Control_Eff">
                                                                                             </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="R_Risk_Exposure" 
                                                                                                 FilterControlAltText="Filter R_Risk_Exposure column" 
                                                                                                 HeaderText="Residual_Risk_Exposure" SortExpression="R_Risk_Exposure" 
                                                                                                 UniqueName="R_Risk_Exposure">
                                                                                             </telerik:GridBoundColumn>
                                                                                         </Columns>
                                                                                         <EditFormSettings>
                                                                                             <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                             </EditColumn>
                                                                                         </EditFormSettings>
                                                                                     </MasterTableView>
                                                                                     <ItemStyle Wrap="False" />
                                                                                     <PagerStyle Wrap="False" />
                                                                                     <FilterMenu EnableImageSprites="False">
                                                                                     </FilterMenu>
                                                                                     <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                                     </HeaderContextMenu>
                                                                                 </telerik:RadGrid>
                                                                             </asp:Panel>
                                                                         </td>
                                                                     </tr>
                                                                 </table>
                                                             </asp:Panel>
                                                        </telerik:RadPageView>
                                                    </telerik:RadMultiPage>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <table style="width: 100%">
                                            <tr>
                                                <td align="center" bgcolor="#666666">
                                                    &nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <asp:Label ID="Label184" runat="server" Text="Export Report" 
                                                        style="font-weight: 700"></asp:Label>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <telerik:RadComboBox ID="cborpt" Runat="server" Skin="Sunset" Width="200px">
                                                        <Items>
                                                            <telerik:RadComboBoxItem runat="server" Owner="cborpt" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Risk Register" Value="RR" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Risk Summary" 
                                                                Value="RS" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Top 10" Value="T10" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Overal Top 10" Value="O10" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Overdue Risks" Value="OD" />
                                                            <telerik:RadComboBoxItem runat="server" Text="Closed Risks" Value="CR" />
                                                        </Items>
                                                    </telerik:RadComboBox>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <telerik:RadButton ID="RadButton1" runat="server" Skin="Simple" 
                                                        style="font-weight: 700" Text="Generate" Width="150px">
                                                    </telerik:RadButton>
                                                    &nbsp;
                                                    <asp:Label ID="lblsubmit" runat="server" Font-Bold="True" Font-Size="Medium" 
                                                        ForeColor="Red"></asp:Label>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        &nbsp;<asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                                        </td>
                                </tr>
                            </table>
   </asp:Panel>
   </div>
            </ContentTemplate>
     
            </asp:UpdatePanel>
</asp:Content>

