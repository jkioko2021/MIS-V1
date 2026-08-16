 <%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Welcome.aspx.vb" Inherits="_Default" %>

<%@ Register Assembly="Telerik.Web.UI" Namespace="Telerik.Web.UI" TagPrefix="telerik" %>
<%@ OutputCache Location="None" %>

<%@ Register Assembly="Telerik.Web.UI" Namespace="Telerik.Charting" TagPrefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" runat="Server">
    <div id="maincontainer" 
    
    style="background-position: center center; background-repeat: no-repeat;">
            <asp:Panel ID="Panel7" runat="server" Height="451px">
                <asp:Panel ID="P6" runat="server" Height="100%" 
    Width="1216px" >
                    <table style="width: 100%; height: 100%;" align="left">
                        <tr>
                            <td style="height: 20px">
                                </td>
                            <td style="height: 20px">
                                <asp:Label ID="L7" runat="server" Font-Size="Small" 
                                    style="font-weight: 700; background-color: #FFFFFF" Text="Year"></asp:Label>
                            </td>
                            <td style="width: 491px; height: 20px;">
                                <asp:Label ID="lblyear" runat="server" style="font-weight: 700"></asp:Label>
                                <telerik:RadComboBox ID="cboname" Runat="server" Height="19px" 
                                    style="margin-left: 0px" Visible="False">
                                </telerik:RadComboBox>
                            </td>
                            <td style="height: 20px">
                                <asp:Label ID="LblErr" runat="server" Font-Bold="true" Font-Size="Small" 
                                        ForeColor="Red" Text=""></asp:Label>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="4">

                                <asp:Panel ID="P0" runat="server">
                                  
                                    <telerik:RadGrid ID="GD_N3" runat="server" AutoGenerateColumns="False" 
                                        CellSpacing="0" FooterStyle-Font-Bold="true" GridLines="None" Height="100%" 
                                        PageSize="12" ShowFooter="True" Skin="Windows7" style="margin-left: 0px" 
                                        Width="72%">
                                        <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                        </HeaderContextMenu>
                                        <MasterTableView>
                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                            </RowIndicatorColumn>
                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                            </ExpandCollapseColumn>
                                            <EditFormSettings>
                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                </EditColumn>
                                            </EditFormSettings>
                                            <Columns>
                                                <telerik:GridBoundColumn DataField="Month_dt" FooterStyle-Font-Bold="true" 
                                                    FooterStyle-ForeColor="Black" FooterText="YTD" HeaderText="MON" 
                                                    UniqueName="Month_dt">
                                                    <ItemStyle Font-Bold="True" />
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn  DataField="File_Status" 
                                                     FooterStyle-Font-Bold="true" HeaderText="File_Status" 
                                                    UniqueName="File_Status">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn  Aggregate="Sum" DataField="cnt_business" 
                                                     FooterStyle-Font-Bold="true" HeaderText="cnt of business" 
                                                    UniqueName="cnt_business">
                                                </telerik:GridBoundColumn>                                                
                                                <telerik:GridBoundColumn Aggregate="Sum" DataField="Premium" 
                                                    DataFormatString="{0:#,#}" FooterStyle-Font-Bold="true" HeaderText="Premium" 
                                                    UniqueName="Premium">
                                                </telerik:GridBoundColumn>
                                               
                                            </Columns>
                                        </MasterTableView>
                                        <FooterStyle BorderStyle="Double" Font-Bold="True" Font-Underline="False" 
                                            ForeColor="Red" />
                                        <FilterMenu EnableImageSprites="False">
                                        </FilterMenu>
                                    </telerik:RadGrid>
                                  
                                </asp:Panel>
                                <asp:Panel ID="P_A" runat="server">
                                  
                                    <telerik:RadGrid ID="GD_AL" runat="server" AllowPaging="True" CellSpacing="0" 
                                        GridLines="None" Height="100%" PageSize="50" Skin="Web20" Width="100%">
                                        <MasterTableView AutoGenerateColumns="False">
                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                <HeaderStyle Width="20px" />
                                            </RowIndicatorColumn>
                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                <HeaderStyle Width="20px" />
                                            </ExpandCollapseColumn>
                                            <Columns>
                                                <telerik:GridBoundColumn DataField="Business_Type" 
                                                    FilterControlAltText="Filter Business_Type column" HeaderText="Business_Type" 
                                                    SortExpression="Business_Type" UniqueName="Business_Type">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="Total_Registered" 
                                                    FilterControlAltText="Filter Total_Registered column" 
                                                    HeaderText="Total_Allocated" SortExpression="Total_Registered" 
                                                    UniqueName="Total_Registered">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="Not_Forwarded" 
                                                    FilterControlAltText="Filter Not_Forwarded column" HeaderText="Not_Forwarded" 
                                                    SortExpression="Not_Forwarded" UniqueName="Not_Forwarded">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="Returned_NotForwarded" 
                                                    FilterControlAltText="Filter Returned_NotForwarded column" 
                                                    HeaderText="Returned_NotForwarded" SortExpression="Returned_NotForwarded" 
                                                    UniqueName="Returned_NotForwarded">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="Not_Allocated" 
                                                    FilterControlAltText="Filter Not_Allocated column" HeaderText="Not_Allocated" 
                                                    SortExpression="Not_Allocated" UniqueName="Not_Allocated">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="Medical_UW" 
                                                    FilterControlAltText="Filter Medical_UW column" HeaderText="Medical_UW" 
                                                    SortExpression="Medical_UW" UniqueName="Medical_UW">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="Declined" 
                                                    FilterControlAltText="Filter Declined column" HeaderText="Declined" 
                                                    SortExpression="Declined" UniqueName="Declined">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="Pricing" 
                                                    FilterControlAltText="Filter Pricing column" HeaderText="Pricing" 
                                                    SortExpression="Pricing" UniqueName="Pricing">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="Waiting_Update" 
                                                    FilterControlAltText="Filter Waiting_Update column" HeaderText="Waiting_Update" 
                                                    SortExpression="Waiting_Update" UniqueName="Waiting_Update">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="Waiting_Payment" 
                                                    FilterControlAltText="Filter Waiting_Payment column" 
                                                    HeaderText="Waiting_Payment" SortExpression="Waiting_Payment" 
                                                    UniqueName="Waiting_Payment">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="Not_Receipted" 
                                                    FilterControlAltText="Filter Not_Receipted column" HeaderText="Not_Receipted" 
                                                    SortExpression="Not_Receipted" UniqueName="Not_Receipted">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="Receipted" 
                                                    FilterControlAltText="Filter Receipted column" HeaderText="Receipted" 
                                                    SortExpression="Receipted" UniqueName="Receipted">
                                                </telerik:GridBoundColumn>
                                            </Columns>
                                            <EditFormSettings>
                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                </EditColumn>
                                            </EditFormSettings>
                                        </MasterTableView>
                                        <FilterMenu EnableImageSprites="False">
                                        </FilterMenu>
                                        <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                        </HeaderContextMenu>
                                    </telerik:RadGrid>
                                  
                                </asp:Panel>
                                <asp:Panel ID="Panel2" runat="server" Width="1061px">
                                    <telerik:RadGrid ID="GD_N4" runat="server" AutoGenerateColumns="False" 
                                        CellSpacing="0" FooterStyle-Font-Bold="true" GridLines="None" Height="100%" 
                                        PageSize="12" ShowFooter="True" Skin="Windows7" style="margin-left: 0px" 
                                        Width="100%">
                                        <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                        </HeaderContextMenu>
                                        <MasterTableView>
                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                            </RowIndicatorColumn>
                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                            </ExpandCollapseColumn>
                                            <EditFormSettings>
                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                </EditColumn>
                                            </EditFormSettings>
                                            <Columns>
                                                <telerik:GridBoundColumn DataField="MON" FooterStyle-Font-Bold="true" 
                                                    FooterStyle-ForeColor="Black" FooterText="YTD" HeaderText="MON" 
                                                    UniqueName="MON">
                                                    <ItemStyle Font-Bold="True" />
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn Aggregate="Sum" DataField="MONTH_BUDGET" 
                                                    DataFormatString="{0:#,#.##}" FooterStyle-Font-Bold="true" HeaderText="BUDGET" 
                                                    UniqueName="MONTH_BUDGET">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn Aggregate="Sum" DataField="ACTUAL_PROD" 
                                                    DataFormatString="{0:#,#.##}" FooterStyle-Font-Bold="true" HeaderText="ACTUAL" 
                                                    UniqueName="ACTUAL_PROD">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn Aggregate="Avg" DataField="PERC_PRODUCTION" 
                                                    DataFormatString="{0:F2} %" FooterStyle-Font-Bold="true" HeaderText="% PROD" 
                                                    UniqueName="PERC_PRODUCTION">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn Aggregate="Sum" DataField="CNT_TOTAL_POLICY" 
                                                    DataFormatString="{0:#,#}" FooterStyle-Font-Bold="true" HeaderText="CNT_POLICY" 
                                                    UniqueName="CNT_TOTAL_POLICY">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn Aggregate="Sum" DataField="CNT_ACT_POLICY" 
                                                    DataFormatString="{0:#,#}" FooterStyle-Font-Bold="true" HeaderText="ACT_POLICY" 
                                                    UniqueName="CNT_ACT_POLICY">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn Aggregate="Avg" DataField="CNT_PERC_POLICY" 
                                                    DataFormatString="{0:F2} %" FooterStyle-Font-Bold="true" HeaderText="% CNT" 
                                                    UniqueName="CNT_PERC_POLICY">
                                                </telerik:GridBoundColumn>


                                              
                                            </Columns>
                                        </MasterTableView>
                                        <FooterStyle BorderStyle="Double" Font-Bold="True" Font-Underline="False" 
                                            ForeColor="Red" />
                                        <FilterMenu EnableImageSprites="False">
                                        </FilterMenu>
                                    </telerik:RadGrid>
                                </asp:Panel>
                            </td>
                        </tr>
                        <tr>
                            <td bgcolor="#CCCCCC" colspan="3" style="height: 23px">
                                <asp:Label ID="L2" runat="server" Font-Size="Small" 
                                    style="font-weight: 700; background-color: #FFFFFF" 
                                    Text="Renewal Production-Medical"></asp:Label>
                            </td>
                            <td bgcolor="#CCCCCC" style="height: 23px">
                                <asp:Label ID="L4" runat="server" Font-Size="Small" 
                                    style="font-weight: 700; background-color: #FFFFFF" 
                                    Text="Renewal Production Non-Medical"></asp:Label>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3" style="height: 62px">
                                <asp:Panel ID="Panel4" runat="server" Width="99%">
                                    <telerik:RadGrid ID="GD_N1" runat="server" AutoGenerateColumns="False" 
                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="12" Skin="Windows7" 
                                            style="margin-left: 0px" Width="98%" ShowFooter="True" 
                                        FooterStyle-Font-Bold="true">
                                        <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                        </HeaderContextMenu>
                                        <MasterTableView>
                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                            </RowIndicatorColumn>
                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                            </ExpandCollapseColumn>
                                            <EditFormSettings>
                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                </EditColumn>
                                            </EditFormSettings>
                                            <Columns>
                                                <telerik:GridBoundColumn DataField="MON" HeaderText="MON" UniqueName="MON" FooterText="YTD" FooterStyle-ForeColor="Black" FooterStyle-Font-Bold="true">
                                                    <ItemStyle Font-Bold="True" />
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="RENEW_MEDICAL" 
                                                        DataFormatString="{0:#,#.##}" HeaderText="BUDGET" 
                                                        UniqueName="RENEW_MEDICAL" Aggregate="Sum"  FooterStyle-Font-Bold="true">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="ACTUAL_RENEW_MED" DataFormatString="{0:#,#.##}" 
                                                        HeaderText="ACTUAL" UniqueName="ACTUAL_RENEW_MED" Aggregate="Sum"  FooterStyle-Font-Bold="true">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="RENEW_PERC_MED" DataFormatString="{0:F2} %" 
                                                        HeaderText="% REN" UniqueName="RENEW_PERC_MED" Aggregate="Avg"  FooterStyle-Font-Bold="true">
                                                </telerik:GridBoundColumn>
                                      <telerik:GridBoundColumn DataField="CNT_POLICY_MED" 
                                                        HeaderText="CNT_MED" UniqueName="CNT_POLICY_MED" DataFormatString="{0:#,#}"  Aggregate="Sum"  FooterStyle-Font-Bold="true">
                                                </telerik:GridBoundColumn>
                                       <telerik:GridBoundColumn DataField="ACT_CNT_MED"  HeaderText="ACT_MED" UniqueName="ACT_CNT_MED" DataFormatString="{0:#,#}"  Aggregate="Sum"  FooterStyle-Font-Bold="true">
                                                </telerik:GridBoundColumn>
                                                  <telerik:GridBoundColumn DataField="CNT_PERC_MED" DataFormatString="{0:F2} %" 
                                                        HeaderText="% CNT" UniqueName="CNT_PERC_MED" Aggregate="Avg"  FooterStyle-Font-Bold="true">
                                                </telerik:GridBoundColumn>
                                                </Columns>
                                        </MasterTableView>
                                        <FooterStyle BorderStyle="Double" Font-Bold="True" Font-Underline="False" 
                                            ForeColor="Red" />
                                        <FilterMenu EnableImageSprites="False">
                                        </FilterMenu>
                                    </telerik:RadGrid>
                                </asp:Panel>
                            </td>
                            <td style="height: 62px">
                                <asp:Panel ID="Panel5" runat="server" Width="507px">
                                    <telerik:RadGrid ID="GD_N2" runat="server" AutoGenerateColumns="False" 
                                            CellSpacing="0" GridLines="None" Height="100%" PageSize="12" Skin="Windows7" 
                                            style="margin-left: 0px" Width="99%" ShowFooter="True" >
                                        <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                        </HeaderContextMenu>
                                        <MasterTableView>
                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                            </RowIndicatorColumn>
                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                            </ExpandCollapseColumn>
                                            <EditFormSettings>
                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                </EditColumn>
                                            </EditFormSettings>
                                            <Columns>
                                                <telerik:GridBoundColumn DataField="MON" HeaderText="MON" UniqueName="MON" FooterText="YTD" FooterStyle-ForeColor="Black" FooterStyle-Font-Bold="true">
                                                    <FooterStyle Font-Bold="True" ForeColor="Black" />
                                                    <ItemStyle Font-Bold="True" />
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="RENEW_NON_MEDICAL" DataFormatString="{0:#,#.##}"   Aggregate="Sum"  FooterStyle-Font-Bold="true"
                                                        HeaderText="BUDGET" UniqueName="RENEW_NON_MEDICAL" >
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="ACTUAL_RENEW_NONMED" DataFormatString="{0:#,#.##}"   Aggregate="Sum"  FooterStyle-Font-Bold="true"
                                                        HeaderText="ACTUAL" UniqueName="ACTUAL_RENEW_NONMED">
                                                </telerik:GridBoundColumn>
                                                <telerik:GridBoundColumn DataField="RENEW_PERC_NONMED" 
                                                        DataFormatString="{0:F2} %" HeaderText="%"   Aggregate="Avg"  FooterStyle-Font-Bold="true"
                                                    UniqueName="RENEW_PERC_NONMED">
                                                </telerik:GridBoundColumn>
                                                    <telerik:GridBoundColumn DataField="CNT_POLICY_NON"
                                                        HeaderText="CNT_NON" UniqueName="CNT_POLICY_NON" DataFormatString="{0:#,#}"  Aggregate="Sum"  FooterStyle-Font-Bold="true">
                                                </telerik:GridBoundColumn>
                                                    <telerik:GridBoundColumn DataField="ACT_CNT_NON" 
                                                        HeaderText="ACT_NON" UniqueName="ACT_CNT_NON" DataFormatString="{0:#,#}"  Aggregate="Sum"  FooterStyle-Font-Bold="true">
                                                </telerik:GridBoundColumn>
                                                     <telerik:GridBoundColumn DataField="CNT_PERC_NONMED" DataFormatString="{0:F2} %" 
                                                        HeaderText="% CNT" UniqueName="CNT_PERC_NONMED" Aggregate="Avg"  FooterStyle-Font-Bold="true">
                                                </telerik:GridBoundColumn>
                                            </Columns>
                                        </MasterTableView>
                                        <FooterStyle ForeColor="Red" />
                                        <ItemStyle Wrap="False" />
                                        <FilterMenu EnableImageSprites="False">
                                        </FilterMenu>
                                    </telerik:RadGrid>
                                </asp:Panel>
                            </td>
                        </tr>
                    </table>
                </asp:Panel>

            </asp:Panel>

           </div>
</asp:Content>

